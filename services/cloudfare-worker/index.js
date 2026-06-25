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
    if (!token) {
      console.log("[DEBUG AUTH] Token missing for payload extraction");
      return null;
    }
    if (!secretStr) {
      console.error("[DEBUG AUTH] JWT_SECRET environment variable is missing!");
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log(`[DEBUG AUTH] Token structure invalid. Expected 3 segments, got ${parts.length}`);
      return null;
    }
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
    
    if (!isValid) {
      console.log("[DEBUG AUTH] Cryptographic HMAC signature check failed.");
      return null;
    }

    let base64Payload = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Payload.length % 4) {
      base64Payload += '=';
    }
    const payload = JSON.parse(atob(base64Payload));
    
    const nowTimestamp = Math.floor(Date.now() / 1000);
    if (payload.exp && nowTimestamp > payload.exp) {
      console.log(`[DEBUG AUTH] Token expired. Exp: ${payload.exp}, Now: ${nowTimestamp}`);
      return null;
    }

    return payload;
  } catch (err) {
    console.error("[DEBUG AUTH] Exception during verification processing:", err.message);
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    // Sanitize the raw incoming URL by decoding components and removing ALL hidden whitespace chunks (\s+)
    const cleanUrlString = decodeURIComponent(request.url).replace(/\s+/g, '');
    console.log(`\n--- [INCOMING REQUEST] ${request.method} -> ${cleanUrlString} ---`);

    if (request.method === "OPTIONS") {
      console.log("[DEBUG OPTIONS] Returning CORS Preflight confirmation");
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
        }
      });
    }

    // Instantiating URL tracking using our cleanly stripped workspace URL
    const url = new URL(cleanUrlString);
    
    // 1. Authentication Checks (Only enforced for streaming manifest entry points via query token)
    if (url.pathname.endsWith(".m3u8")) {
      console.log("[DEBUG AUTH] .m3u8 manifest route detected. Validating query token...");
      
      const queryToken = url.searchParams.get("token");
      console.log(`[DEBUG AUTH] Query token parameter present: ${!!queryToken}`);

      const queryPayload = await verifyAndGetPayload(queryToken, env.JWT_SECRET);
      
      if (!queryPayload) {
        console.warn("[DEBUG AUTH] Access Denied: Query token verification failed or token expired.");
        return new Response("Unauthorized: Invalid token session", { 
          status: 401,
          headers: { "X-Debug-Reason": "Auth-Failure-Invalid-Query-Token" }
        });
      }

      console.log("[DEBUG AUTH] Query token cryptographic signature verified successfully.");
    }

    // 2. Generate Custom Cache Key Namespace Rewrite
    // Maps /download/ path scopes over to /image/ or /watch/ to protect proxy redirect structures
    const cacheUrl = new URL(cleanUrlString);
    const originalPathname = cacheUrl.pathname;
    
    if (cacheUrl.pathname.startsWith('/download/')) {
      if (cacheUrl.pathname.endsWith('.webp')) {
        cacheUrl.pathname = cacheUrl.pathname.replace('/download/', '/image/');
      } else {
        cacheUrl.pathname = cacheUrl.pathname.replace('/download/', '/watch/');
      }
      console.log(`[DEBUG PATH] Translated Cache namespace key: ${originalPathname} -> ${cacheUrl.pathname}`);
    }
    cacheUrl.searchParams.delete("token"); 

    const cache = caches.default;
    
    // 3. Cache Lookup
    if (request.method === "GET") {
      console.log(`[DEBUG CACHE] Testing against key namespace: ${cacheUrl.pathname}`);
      const cachedResponse = await cache.match(cacheUrl);
      if (cachedResponse) {
        console.log("[DEBUG CACHE] Cache Status: HIT 🎉");
        const responseWithHitHeader = new Response(cachedResponse.body, cachedResponse);
        responseWithHitHeader.headers.set("X-Cache-Status", "HIT");
        return responseWithHitHeader;
      }
      console.log("[DEBUG CACHE] Cache Status: MISS 🔍 (Fetching from storage tier)");
    }

    // 4. Set up storage fetch layer URL targeting B2 Bucket Root Directory
    const baseBackendUrl = env.B2_URL.replace(/\/$/, '');
    
    // Drop the '/download/' segment prefix entirely, making it root relative ('/') for your S3 bucket structural mapping
    const bucketRelativePath = url.pathname.replace(/^\/download\//, '/');
    const targetFetchUrl = `${baseBackendUrl}/${env.B2_INPUT_BUCKET}${bucketRelativePath}`;
    
    console.log(`[DEBUG STORAGE] Proxy destination URL constructed -> ${targetFetchUrl}`);
    
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
      console.log(`[DEBUG STORAGE] Forwarding byte offset seek Range header: ${incomingRange}`);
      requestHeaders["Range"] = incomingRange;
    }

    // 5. Fetch from Backblaze B2 S3 API
    const backendResponse = await aws.fetch(targetFetchUrl, {
      method: request.method,
      headers: requestHeaders
    });
    
    console.log(`[DEBUG STORAGE] S3 fetch invocation returned status code: ${backendResponse.status}`);

    // 6. Build fresh response headers
    const corsHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified'];
    headersToCopy.forEach(header => {
      const val = backendResponse.headers.get(header);
      if (val) corsHeaders.set(header, val);
    });

    // 7. Dynamic Cache-Control enforcement
    corsHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

    // 8. Inject Cross-Origin parameters
    const clientOrigin = request.headers.get("Origin");
    if (clientOrigin) {
      corsHeaders.set("Access-Control-Allow-Origin", clientOrigin);
      corsHeaders.set("Access-Control-Allow-Credentials", "true");
    } else {
      corsHeaders.set("Access-Control-Allow-Origin", "*");
    }
    corsHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    corsHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
    corsHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges, X-Cache-Status");
    corsHeaders.set("X-Cache-Status", "MISS");

    const finalResponse = new Response(backendResponse.status === 304 ? null : backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: corsHeaders
    });

    // 9. Commit to Cache asynchronously using modified cacheUrl key namespace
    if (request.method === "GET" && (backendResponse.status === 200 || backendResponse.status === 206)) {
      console.log(`[DEBUG CACHE] Storing asset inside edge cache layout using namespace key: ${cacheUrl.pathname}`);
      ctx.waitUntil(cache.put(cacheUrl, finalResponse.clone()));
    }

    return finalResponse;
  }
};