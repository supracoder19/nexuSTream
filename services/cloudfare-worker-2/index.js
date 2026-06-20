import { AwsClient } from 'aws4fetch';

export default {
  async fetch(request, env, ctx) {
    
    const url = new URL(request.url);
    console.log(url.searchParams.get("token"),env.TRANSCODER_SECRET);

    // 1. Security Layer for Transcoder
    const authToken = url.searchParams.get("token");
    if (!authToken || authToken !== env.TRANSCODER_SECRET) {
      return new Response("Unauthorized Transcoder Request", { status: 401 });
    }

    // 2. Direct Backend Mapping to Private B2 Input Bucket
    const targetStorageUrl = `${env.B2_INPUT_ORIGIN}${url.pathname}`;

    // 3. Initialize S3 client for the Private Input Bucket
    const aws = new AwsClient({
      accessKeyId: env.B2_INPUT_ACCESS_KEY_ID,
      secretAccessKey: env.B2_INPUT_SECRET_ACCESS_KEY,
      service: 's3',
      region: env.B2_INPUT_REGION
    });

    // 4. Fetch the asset using Bandwidth Alliance
    // We pass custom `cf` options to the internal fetch to tell Cloudflare's edge NEVER to cache this.
    const signedResponse = await aws.fetch(targetStorageUrl, {
      method: "GET",
      headers: {
        "Accept": request.headers.get("Accept") || "*/*",
      },
      cf: {
        cacheTtl: 0,            // Do not cache at the edge
        cacheEverything: false  // Ensure standard CDN caching rules are bypassed
      }
    });

    // 5. Force the Transcoder client/system to never cache it either
    // We create a fresh response object so we can append strict anti-caching headers.
    const response = new Response(signedResponse.body, signedResponse);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  }
};