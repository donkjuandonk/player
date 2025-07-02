export default {
  async fetch(request) {
    const url = new URL(request.url);
    const imdb = url.searchParams.get("imdb");
    const format = url.searchParams.get("format") || "html";

    if (!imdb) {
      return new Response("Missing IMDb ID", { status: 400 });
    }

    const hosts = [
      `https://godriveplayer.com/player.php?imdb=${imdb}`,
      `https://vidsrc.net/embed/movie?imdb=${imdb}`,
      `https://multiembed.mov/?video_id=${imdb}`
    ];

    const fallbackMirrors = {
      "tt1375666": [
        "https://mirror1.example.com/embed/tt1375666",
        "https://mirror2.example.com/embed/tt1375666"
      ]
    };

    let iframeUrl = null;

    for (let host of hosts) {
      try {
        const res = await fetch(host);
        const html = await res.text();
        const match = html.match(/<iframe[^>]+src=["']([^"']+)["']/);
        if (match) {
          iframeUrl = match[1].startsWith("http") ? match[1] : host.match(/https?:\/\//)[0] + host.split("/")[2] + match[1];
          break;
        }
      } catch (e) {}
    }

    if (!iframeUrl && fallbackMirrors[imdb]) {
      iframeUrl = fallbackMirrors[imdb][0]; // Use first mirror as fallback
    }

    if (!iframeUrl) {
      return new Response("No working source found", { status: 404 });
    }

    if (format === "json") {
      return new Response(JSON.stringify({ iframe: iframeUrl }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const playerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Streaming Player</title>
  <style>
    html, body {
      margin: 0; padding: 0;
      background: black;
      height: 100%;
      overflow: hidden;
    }
    iframe {
      border: none;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <iframe src="\${iframeUrl}" allowfullscreen allow="autoplay"></iframe>
</body>
</html>
    \`.trim();

    return new Response(playerHtml, {
      headers: { "Content-Type": "text/html" }
    });
  }
};
