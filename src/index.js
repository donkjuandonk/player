// Cloudflare Worker: Serve API & HTML UI for streaming players (fullscreen + clean UI)
const htmlTemplate = (imdb, results) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Watch Movie - ${imdb}</title>
  <style>
    html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
    #buttons { position: fixed; top: 0; left: 0; right: 0; padding: 10px; background: rgba(0, 0, 0, 0.8); z-index: 10; text-align: center; }
    #buttons button { margin: 5px; padding: 8px 14px; background: #111; color: white; border: none; border-radius: 4px; cursor: pointer; }
    #buttons button:hover { background: #333; }
    #player { position: fixed; top: 50px; bottom: 0; left: 0; right: 0; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <div id="buttons">
    ${results.map((r, i) => `<button onclick="select(${i})">Server ${i + 1}</button>`).join('')}
  </div>
  <div id="player"></div>
  <script>
    const results = ${JSON.stringify(results)};
    function select(i) {
      const iframe = document.createElement('iframe');
      iframe.src = results[i].iframe;
      document.getElementById('player').innerHTML = '';
      document.getElementById('player').appendChild(iframe);
    }
    if (results.length) select(0);
  </script>
</body>
</html>
`;

const landingPage = `
<!DOCTYPE html>
<html>
<head>
  <title>Streaming Player</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background: #0c0c0c; color: white; text-align: center; font-family: sans-serif; padding: 2rem; }
    input { padding: 0.5rem; width: 300px; max-width: 80%; margin-top: 1rem; }
    button { padding: 0.5rem 1rem; margin-top: 1rem; background: #1f1f1f; color: white; border: none; cursor: pointer; }
    button:hover { background: #333; }
  </style>
</head>
<body>
  <h1>🎬 Watch Movies Instantly</h1>
  <p>Enter IMDb ID to watch (example: tt1375666):</p>
  <input type="text" id="imdb" placeholder="IMDb ID (e.g. tt1234567)">
  <br>
  <button onclick="go()">Watch Now</button>
  <script>
    function go() {
      const id = document.getElementById('imdb').value.trim();
      if (id) location.href = '/?imdb=' + id + '&format=html';
    }
  </script>
</body>
</html>
`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const imdb = url.searchParams.get("imdb");
    const format = url.searchParams.get("format") || "json";
    const server = url.searchParams.get("server") || null;

    if (!imdb) {
      return new Response(landingPage, { headers: { "content-type": "text/html" } });
    }

    function extractIframeSrc(html) {
      const match = html.match(/<iframe[^>]+src=["']([^"']+)["']/);
      return match ? match[1] : null;
    }

    const results = [];

    const hosts = [
      { name: "vidsrc.net", url: `https://vidsrc.net/embed/movie?imdb=${imdb}` },
      { name: "godriveplayer.com", url: `https://godriveplayer.com/player.php?imdb=${imdb}` },
      { name: "multiembed.mov", url: `https://multiembed.mov/?video_id=${imdb}` },
      { name: "doodstream (stub)", url: `https://dood.yt/e/${imdb}` },
      { name: "streamtape (stub)", url: `https://streamtape.com/e/${imdb}` },
      { name: "mixdrop (stub)", url: `https://mixdrop.co/f/${imdb}` },
      { name: "voe (stub)", url: `https://voe.sx/e/${imdb}` }
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
      return new Response(htmlTemplate(imdb, results), {
        headers: { "content-type": "text/html" }
      });
    }

    return new Response(JSON.stringify({ imdb, results }), {
      headers: { "content-type": "application/json" }
    });
  }
};
