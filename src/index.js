// Cloudflare Worker: Multi-host iframe scraper with HTML embed output
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const imdb = url.searchParams.get("imdb");
    const format = url.searchParams.get("format") || "json";
    const server = url.searchParams.get("server") || null;

    if (!imdb) {
      return new Response("IMDb ID is required.", {
        status: 400,
        headers: { "content-type": "text/plain" }
      });
    }

    function extractIframeSrc(html) {
      const match = html.match(/<iframe[^>]+src=["']([^"']+)["']/);
      return match ? match[1] : null;
    }

    const results = [];

    const hosts = [
      {
        name: "vidsrc.net",
        url: `https://vidsrc.net/embed/movie?imdb=${imdb}`
      },
      {
        name: "godriveplayer.com",
        url: `https://godriveplayer.com/player.php?imdb=${imdb}`
      },
      {
        name: "multiembed.mov",
        url: `https://multiembed.mov/?video_id=${imdb}`
      },
      {
        name: "doodstream (stub)",
        url: `https://dood.yt/e/${imdb}` // Placeholder - requires mapping
      },
      {
        name: "streamtape (stub)",
        url: `https://streamtape.com/e/${imdb}` // Placeholder - requires mapping
      },
      {
        name: "mixdrop (stub)",
        url: `https://mixdrop.co/f/${imdb}` // Placeholder - requires mapping
      },
      {
        name: "voe (stub)",
        url: `https://voe.sx/e/${imdb}` // Placeholder - requires mapping
      }
    ];

    for (const host of hosts) {
      try {
        const r = await fetch(host.url);
        const h = await r.text();
        const f = extractIframeSrc(h);
        if (f) results.push({ source: host.name, iframe: f });
      } catch (e) {}
    }

    if (results.length === 0) {
      return new Response("No playable iframe found.", {
        status: 404,
        headers: { "content-type": "text/plain" }
      });
    }

    if (server) {
      const found = results.find(r => r.source.toLowerCase().includes(server.toLowerCase()));
      if (found) {
        return Response.redirect(found.iframe, 302);
      } else {
        return new Response(`Server '${server}' not found.`, {
          status: 404,
          headers: { "content-type": "text/plain" }
        });
      }
    }

    if (format === "html") {
      const players = results.map(r => `<h3>${r.source}</h3><iframe src="${r.iframe}" width="100%" height="480" allowfullscreen></iframe>`).join("<hr>");
      return new Response(`<!DOCTYPE html><html><head><title>Players</title></head><body>${players}</body></html>`, {
        headers: { "content-type": "text/html" }
      });
    }

    return new Response(JSON.stringify({ imdb, results }), {
      headers: { "content-type": "application/json" }
    });
  }
};
