import { AwsClient } from 'aws4fetch';

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

async function verifyAndGetPayload(token, secretStr) {
  try {
    if (!token || !secretStr) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    let normalizedSecret = secretStr.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (normalizedSecret.length % 4) {
      normalizedSecret += '=';
    }
    const secretBinary = atob(normalizedSecret);
    const secretKeyData = new Uint8Array(secretBinary.length);
    for (let i = 0; i < secretBinary.length; i++) {
      secretKeyData[i] = secretBinary.charCodeAt(i);
    }

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      secretKeyData,
      { name: "HMAC", hash: "SHA-384" },
      false,
      ["verify"]
    );

    let base64Sig = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Sig.length % 4) {
      base64Sig += '=';
    }
    const signatureBinary = atob(base64Sig);
    const signature = Uint8Array.from(signatureBinary, c => c.charCodeAt(0));

    const encoder = new TextEncoder();
    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify("HMAC", cryptoKey, signature, dataToVerify);
    if (!isValid) return null;

    let base64Payload = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Payload.length % 4) {
      base64Payload += '=';
    }
    const payload = JSON.parse(atob(base64Payload));
    
    if (payload.exp && (Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

function getCookie(request, name) {
  const cookieString = request.headers.get("Cookie");
  if (!cookieString) return null;

  const cookies = cookieString.split(";");
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    // Handle standard preflight check requests for cross-subdomain streaming hooks
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
        }
      });
    }

    const url = new URL(request.url);
    
    // 1. Verify Access if target is an HLS playlist tracker (.m3u8)
    if (url.toString().endsWith(".m3u8")) {
      const queryToken = url.searchParams.get("token");
      const cookieToken = getCookie(request, "accessToken");
      
      const queryPayload = await verifyAndGetPayload(queryToken, env.JWT_SECRET);
      const cookiePayload = await verifyAndGetPayload(cookieToken, env.JWT_SECRET);
      
      if (!queryPayload || !cookiePayload) {
        return new Response("Unauthorized: Missing or invalid authentication tokens", { status: 401 });
      }

      const queryUser = queryPayload.sub || queryPayload.username;
      const cookieUser = cookiePayload.sub || cookiePayload.username;

      if (!queryUser || !cookieUser || queryUser !== cookieUser) {
        return new Response("Forbidden: Token identity mismatch", { status: 403 });
      }
    }
    else if (url.toString().endsWith(".webp")) {
      const cookieToken = getCookie(request, "accessToken");
      
      const cookiePayload = await verifyAndGetPayload(cookieToken, env.JWT_SECRET);
      
      if ( !cookiePayload) {
        return new Response("Unauthorized: Missing or invalid authentication tokens", { status: 401 });
      }
    }

    // 2. Prepare clean URL params for storage fetch layer
    url.searchParams.delete("token");
    const baseBackendUrl = env.B2_URL.replace(/\/$/, '');
    const targetFetchUrl = `${baseBackendUrl}/${env.B2_INPUT_BUCKET}${url.pathname}`;

    console.log(targetFetchUrl);
    
    // 3. Initialize the S3-Compatible Request Signer for B2
    const aws = new AwsClient({
      accessKeyId: env.B2_INPUT_ACCESS_KEY_ID,
      secretAccessKey: env.B2_INPUT_SECRET_ACCESS_KEY,
      service: 's3',
      region: env.B2_INPUT_REGION
    });

    /// 4. Clean up headers to drop missing properties safely before passing to aws4fetch
    const requestHeaders = {
      "Accept": request.headers.get("Accept") || "*/*",
    };

    // Only attach Range header if it actually exists in the incoming request
    const incomingRange = request.headers.get("Range");
    if (incomingRange) {
      requestHeaders["Range"] = incomingRange;
    }

    // 5. Fetch response from B2
    const backendResponse = await aws.fetch(targetFetchUrl, {
      method: request.method,
      headers: requestHeaders
    });

    // 6. Create a fresh header map based on the backend response
    const corsHeaders = new Headers();

    // Copy vital structural headers if they exist
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'cache-control', 'last-modified'];
    headersToCopy.forEach(header => {
      const val = backendResponse.headers.get(header);
      if (val) corsHeaders.set(header, val);
    });

    // 7. FORCE inject CORS headers explicitly (Crucial for 304 / 206 / 200 statuses alike)
    const clientOrigin = request.headers.get("Origin");
    if (clientOrigin) {
      corsHeaders.set("Access-Control-Allow-Origin", clientOrigin);
      corsHeaders.set("Access-Control-Allow-Credentials", "true");
    } else {
      corsHeaders.set("Access-Control-Allow-Origin", "*");
    }
    
    corsHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    corsHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, Range");
    corsHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

    // 8. Return with matching backend status codes intact
    return new Response(backendResponse.status === 304 ? null : backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: corsHeaders
    });
  }
};