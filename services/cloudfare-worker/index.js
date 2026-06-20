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

    // 1. Decode Base64 Secret string to match Java's Decoders.BASE64.decode
    let normalizedSecret = secretStr.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (normalizedSecret.length % 4) {
      normalizedSecret += '=';
    }
    const secretBinary = atob(normalizedSecret);
    const secretKeyData = new Uint8Array(secretBinary.length);
    for (let i = 0; i < secretBinary.length; i++) {
      secretKeyData[i] = secretBinary.charCodeAt(i);
    }

    // 2. Import CryptoKey matching backend HS384 algorithm scale
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      secretKeyData,
      { name: "HMAC", hash: "SHA-384" },
      false,
      ["verify"]
    );

    // 3. Process Signature Array
    let base64Sig = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Sig.length % 4) {
      base64Sig += '=';
    }
    const signatureBinary = atob(base64Sig);
    const signature = Uint8Array.from(signatureBinary, c => c.charCodeAt(0));

    // 4. Verify cryptographic authenticity
    const encoder = new TextEncoder();
    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify("HMAC", cryptoKey, signature, dataToVerify);
    if (!isValid) return null;

    // 5. Decode Payload and validate expiration bounds
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

    // Prepare clean URL params and forward proxy properties
    url.searchParams.delete("token");
    const baseBackendUrl = env.B2_URL.replace(/\/$/, '');
    const targetFetchUrl = `${baseBackendUrl}${url.pathname}${url.search}`;

    // Reconstruct clean backend request headers
    const proxyHeaders = new Headers(request.headers);
    proxyHeaders.delete("Host");

    const backendResponse = await fetch(targetFetchUrl, {
      method: request.method,
      headers: proxyHeaders
    });

    // Mirror upstream responses with optimal frontend runtime CORS rules
    const response = new Response(backendResponse.body, backendResponse);
    const clientOrigin = request.headers.get("Origin");
    
    if (clientOrigin) {
      response.headers.set("Access-Control-Allow-Origin", clientOrigin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    } else {
      response.headers.set("Access-Control-Allow-Origin", "*");
    }
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");

    return response;
  }
};