/**
 * Cloudflare Worker: same-origin-friendly proxy to Frankfurter ECB rates API.
 * Deploy with Wrangler, then set pages.config.json frankfurterProxyBase to your worker URL (no trailing slash).
 */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { ...corsHeaders(), "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    if (path !== "/latest" && path !== "") {
      return new Response("Not found. Use GET /latest?from=USD&to=EUR", {
        status: 404,
        headers: { ...corsHeaders(), "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const upstreamUrl = `https://api.frankfurter.app/latest${url.search}`;
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" }
    });

    const body = await upstream.arrayBuffer();
    const out = new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(),
        "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8"
      }
    });

    return out;
  }
};
