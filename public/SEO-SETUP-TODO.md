# SEO Setup — Remaining To-Dos

Everything that could be fixed directly in the code has been done (see git-less changelog at the bottom).
What's left needs your own accounts/credentials, so here's exactly what to do.

## 1. Google Search Console (do this first)

Why: without it you're invisible to yourself — no idea what Google has indexed, what you rank for, or if there's a crawl error.

1. Go to https://search.google.com/search-console
2. Add property → choose "URL prefix" → enter `https://alead-ae.web.app/`
3. Verify ownership — easiest method since this is Firebase Hosting: "HTML tag" option, paste the meta tag it gives you into `index.html`'s `<head>` (I can add it for you if you paste the tag here)
4. Once verified, go to Sitemaps → submit `sitemap.xml`
5. Check back in ~3-7 days under "Pages" to see indexing status, and "Performance" for what queries you're showing up for

## 2. Google Analytics 4

Why: tells you actual traffic, where visitors come from, and whether they convert (fill the contact/referral forms).

1. Go to https://analytics.google.com → Admin → Create Property → name it "Alead"
2. Create a Web data stream for `https://alead-ae.web.app`
3. Copy the Measurement ID (looks like `G-XXXXXXXXXX`)
4. Send it to me and I'll drop the GA4 snippet into `index.html` — takes 2 minutes once you have the ID

## 3. Organization schema — social profiles

The `Organization` JSON-LD in `index.html` currently has no `sameAs` (links to your official social profiles). Adding them helps Google connect your brand as one entity across the web (useful for a Knowledge Panel later).

If Alead has any of these, send me the URLs and I'll add them:
- LinkedIn company page
- Instagram
- X / Twitter
- Facebook page
- YouTube

## 4. Custom domain (optional but recommended)

You're currently on `alead-ae.web.app` (Firebase's free subdomain). For a business site, a custom domain (e.g. `alead.ai`, `alead.in`, `alead.co`) is worth it:
- Looks more trustworthy in search results and when shared
- You control the brand instead of it being tied to `web.app`
- Buy it from any registrar (Google Domains successor Squarespace, Namecheap, GoDaddy, Cloudflare — Cloudflare sells at cost, no markup)

### After you buy the domain — do these in order

1. **Connect it to Firebase Hosting**
   - Firebase console → Hosting → "Add custom domain" → enter your domain
   - Firebase gives you DNS records (usually an `A` record, sometimes `TXT` for verification) — add those at your registrar's DNS settings
   - Wait for propagation (~15 min to a few hours) and for Firebase to auto-provision the SSL certificate — don't skip this, the site must serve `https://` on the new domain before anything else below matters

2. **Decide the canonical version and stick to it** — pick `https://alead.xxx` or `https://www.alead.xxx` (not both) and 301-redirect the other to it. Do the same for the bare `web.app` URL — redirect it to the new domain rather than leaving both live, otherwise Google sees duplicate content.

3. **Tell me once DNS + SSL are live** — I'll do a find-and-replace across the code for every place `alead-ae.web.app` is hardcoded:
   - `<link rel="canonical">`
   - `og:url`, `og:image`, `twitter:image`
   - JSON-LD `Organization.url` and `.logo`
   - `robots.txt` (Sitemap: line)
   - `sitemap.xml` (`<loc>`)

4. **Re-verify in Google Search Console** as a new property for the new domain (Search Console treats domains separately — your old `web.app` verification doesn't carry over). Submit the sitemap again under the new property.

5. **Update Google Analytics** — add the new domain as an additional stream/hostname if GA4 is already set up, so traffic isn't split across two properties.

6. **Set up a 301 redirect from the old `web.app` URL to the new domain** so any links, bookmarks, or indexed pages pointing at the old URL forward visitors (and search engines) to the new one instead of 404ing.

7. **Update anywhere else the old URL is written down** — WhatsApp Business profile, Google Business Profile (if set up), email signatures, social bios, any ads you're running.

## 5. Custom 404 page

Right now a broken link shows Firebase's generic "Page Not Found" page (it does return a correct 404 status, so it's not an SEO problem — just an ugly one). Say the word and I'll design a branded 404 page that matches the site.

## 6. Google Business Profile (if Alead has a physical/service presence)

If you want to show up in local search / Google Maps for "AI lead management software [city]" type searches, set up a free listing at https://business.google.com. Only worth doing if you have a real business address or clearly defined service area.

## 7. Bing Webmaster Tools (low effort, do anytime)

Same idea as Search Console but for Bing/Yahoo/DuckDuckGo traffic. https://www.bing.com/webmasters — you can actually import your Google Search Console verification directly, takes under a minute once GSC is set up.

---

## Already done (2026-09-07)

- Compressed & converted hero/logo/chatbot images to WebP — ~6.9MB → ~280KB combined
- Added `width`/`height` to every `<img>` (prevents layout shift) and `loading="lazy"` on below-the-fold images
- Rewrote page title to include a real search phrase ("AI Lead Management Software")
- Trimmed meta/OG/Twitter description to 156 characters so Google stops truncating it
- Replaced the 1.1MB OG image with a 65KB flattened JPEG made for link previews
- Added `manifest.json` (mobile/PWA signal)
- Bumped `sitemap.xml` lastmod date
