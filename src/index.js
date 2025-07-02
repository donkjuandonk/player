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

    async function getTitleFromIMDb(imdbID) {
      try {
        const res = await fetch(`https://www.omdbapi.com/?apikey=4a3b711b&i=${imdbID}`);
        const data = await res.json();
        return data.Title || imdbID;
      } catch {
        return imdbID;
      }
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

    const title = await getTitleFromIMDb(imdb);

    if (format === "html") {
      const players = results.map(r => `<h3>${r.source}</h3><iframe src="${r.iframe}" width="100%" height="480" allowfullscreen></iframe>`).join("<hr>");
            const notice = `<div style="position: absolute !important;top:0px;left: 0px !important;right:0;padding:10px;text-align:center;background: url(https://idxxi.buzz/wp-content/themes/indoxxi-new/images/mask-title.png) center top repeat-x !important;color:white;font-weight:bold;z-index:9999;font-family:sans-serif;transform: none !important;height: auto !important;width: 100% !important;">Pasang 1.1.1.1 VPN Agar muncul Sub Indo</div>`;
      return new Response(`<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      overflow: hidden;
      background-color: black;
    }
    iframe {
      position: absolute;
      top: 0;
      left: 0;
      border: none;
      width: 100%;
      height: 100%;
    }
  </style>
</head><body>${players} <script>
  // Disable right click
  document.addEventListener("contextmenu", event => event.preventDefault());

  // Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+C
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C")) ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault();
    }
  });
</script></body></html>`, {
        headers: { "content-type": "text/html" }
      });
    }

    return new Response(JSON.stringify({ imdb, title, results }), {
      headers: { "content-type": "application/json" }
    });
  }
};
