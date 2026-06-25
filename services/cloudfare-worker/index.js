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
    
    // 1. Authentication Checks
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
      
      if (!cookiePayload) {
        return new Response("Unauthorized: Missing or invalid authentication tokens", { status: 401 });
      }
    }

    // 2. Generate Custom Cache Key Namespace Rewrite
    const cacheUrl = new URL(request.url);
    if (cacheUrl.pathname.startsWith('/download/')) {
      if (cacheUrl.pathname.endsWith('.webp')) {
        cacheUrl.pathname = cacheUrl.pathname.replace('/download/', '/image/');
      } else {
        cacheUrl.pathname = cacheUrl.pathname.replace('/download/', '/watch/');
      }
    }
    cacheUrl.searchParams.delete("token"); 

    const cache = caches.default;
    
    // 3. Cache Lookup
    if (request.method === "GET") {
      const cachedResponse = await cache.match(cacheUrl);
      if (cachedResponse) {
        // Add a debug header so you can verify it's working
        const responseWithHitHeader = new Response(cachedResponse.body, cachedResponse);
        responseWithHitHeader.headers.set("X-Cache-Status", "HIT");
        return responseWithHitHeader;
      }
    }

    // 4. Set up storage fetch layer URL targeting B2
    url.searchParams.delete("token");
    const baseBackendUrl = env.B2_URL.replace(/\/$/, '');
    const targetFetchUrl = `${baseBackendUrl}/${env.B2_INPUT_BUCKET}${url.pathname}`;
    
    const aws = new AwsClient({
      accessKeyId: env.B2_INPUT_ACCESS_KEY_ID,
      secretAccessKey: env.B2_INPUT_SECRET_ACCESS_KEY,
      service: 's3',
      region: env.B2_INPUT_REGION
    });

    const requestHeaders = {
      "Accept": request.headers.get("Accept") || "*/*",
    };

    const incomingRange = request.headers.get("Range");
    if (incomingRange) {
      requestHeaders["Range"] = incomingRange;
    }

    // 5. Fetch from Backblaze B2
    const backendResponse = await aws.fetch(targetFetchUrl, {
      method: request.method,
      headers: requestHeaders
    });

    // 6. Build fresh response headers
    const corsHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
    headersToCopy.forEach(header => {
      const val = backendResponse.headers.get(header);
      if (val) corsHeaders.set(header, val);
    });

    // 7. Dynamic Cache-Control enforcement
    if (url.pathname.endsWith('.m3u8')) {
      corsHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      // 1 year for static .ts chunks and .webp images
      corsHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    }

    // 8. Inject Cross-Origin parameters
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

    // Add debug marker for miss tracking
    corsHeaders.set("X-Cache-Status", "MISS");

    const finalResponse = new Response(backendResponse.status === 304 ? null : backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: corsHeaders
    });

    // 9. Commit to Cache asynchronously
    // Backblaze often returns generic private/no-cache headers that block cache.put().
    // Cloudflare safely saves this custom finalResponse because we explicitly defined a public Cache-Control above.
    if (request.method === "GET" && (backendResponse.status === 200 || backendResponse.status === 206)) {
      ctx.waitUntil(cache.put(cacheUrl, finalResponse.clone()));
    }

    return finalResponse;
  }
};