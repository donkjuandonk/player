# VIDSRC Multi-Host Scraper Player (Cloudflare Worker)

🔹 Endpoint: `/?imdb=tt1375666`  
🔹 Optional: `&format=json` to return iframe only

## Supported Hosts

- godriveplayer.com
- vidsrc.net/embed/movie?imdb=ID
- multiembed.mov/?video_id=ID
- fallback JSON mirror (editable)

## Deploy

1. Edit `wrangler.toml` with your `account_id`
2. Install Wrangler: `npm install -g wrangler`
3. Run: `wrangler deploy`