const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());
app.use(cors());

async function tryOEmbed(url) {
  const oembedEndpoints = [
    { match: /youtube\.com|youtu\.be/, url: u => `https://www.youtube.com/oembed?url=${encodeURIComponent(u)}&format=json` },
    { match: /tiktok\.com/, url: u => `https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}` },
    { match: /twitter\.com/, url: u => `https://publish.twitter.com/oembed?url=${encodeURIComponent(u)}` },
    { match: /instagram\.com/, url: u => `https://api.instagram.com/oembed/?url=${encodeURIComponent(u)}` },
  ];
  for (const ep of oembedEndpoints) {
    if (ep.match.test(url)) {
      try {
        const { data } = await axios.get(ep.url(url), { timeout: 8000 });
        return {
          title: data.title || '',
          description: data.author_name || '',
          thumbnail: data.thumbnail_url || '',
        };
      } catch (e) { /* ignore */ }
    }
  }
  return null;
}

async function tryCorsProxy(url, proxyBase) {
  try {
    const proxyUrl = proxyBase + encodeURIComponent(url);
    const { data } = await axios.get(proxyUrl, { timeout: 10000 });
    const html = data.contents || data;
    return extractMetaFromHtml(html, url);
  } catch (e) {
    return null;
  }
}

function extractMetaFromHtml(html, url) {
  const $ = cheerio.load(html);
  let title =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('meta[name="title"]').attr('content') ||
    $('title').text() ||
    $('h1').text() ||
    '';
  let description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('meta[property="description"]').attr('content') ||
    '';
  let thumbnail =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    '';
  if (!thumbnail) {
    let maxArea = 0, bestImg = '';
    $('img').each((i, img) => {
      const src = $(img).attr('src') || '';
      const width = parseInt($(img).attr('width') || '0');
      const height = parseInt($(img).attr('height') || '0');
      const area = width * height;
      if (src && area > maxArea && !src.startsWith('data:')) {
        maxArea = area;
        bestImg = src;
      }
    });
    if (bestImg) thumbnail = bestImg;
  }
  // Fallback: favicon
  if (!thumbnail) {
    let favicon = $('link[rel="icon"]').attr('href') ||
                  $('link[rel="shortcut icon"]').attr('href') ||
                  '';
    if (favicon) {
      if (!favicon.startsWith('http')) {
        try {
          const { origin } = new URL(url);
          favicon = origin + (favicon.startsWith('/') ? favicon : '/' + favicon);
        } catch {}
      }
      thumbnail = favicon;
    } else {
      try {
        const { origin } = new URL(url);
        thumbnail = `${origin}/favicon.ico`;
      } catch {
        thumbnail = '';
      }
    }
  }
  return { title: title.trim(), description: description.trim(), thumbnail: thumbnail.trim() };
}

async function tryPuppeteer(url) {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    const meta = await page.evaluate(() => {
      const getMeta = (name, prop) =>
        document.querySelector(`meta[${prop}='${name}']`)?.content || null;
      let title = getMeta('og:title', 'property')
        || getMeta('twitter:title', 'name')
        || document.title
        || document.querySelector('h1')?.innerText
        || '';
      let description = getMeta('og:description', 'property')
        || getMeta('twitter:description', 'name')
        || getMeta('description', 'name')
        || '';
      let thumbnail = getMeta('og:image', 'property')
        || getMeta('twitter:image', 'name')
        || '';
      if (!thumbnail) {
        let maxArea = 0, bestImg = '';
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || '';
          const area = (img.naturalWidth || 0) * (img.naturalHeight || 0);
          if (src && area > maxArea && !src.startsWith('data:')) {
            maxArea = area;
            bestImg = src;
          }
        });
        if (bestImg) thumbnail = bestImg;
      }
      // Fallback: favicon
      if (!thumbnail) {
        let favicon = document.querySelector('link[rel="icon"]')?.href
          || document.querySelector('link[rel="shortcut icon"]')?.href
          || '';
        if (favicon) {
          if (!favicon.startsWith('http')) {
            try {
              const { origin } = new URL(window.location.href);
              favicon = origin + (favicon.startsWith('/') ? favicon : '/' + favicon);
            } catch {}
          }
          thumbnail = favicon;
        } else {
          try {
            const { origin } = new URL(window.location.href);
            thumbnail = `${origin}/favicon.ico`;
          } catch {
            thumbnail = '';
          }
        }
      }
      return { title, description, thumbnail };
    });
    await browser.close();
    return meta;
  } catch (e) {
    if (browser) await browser.close();
    return null;
  }
}

app.post('/api/extract-metadata', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  let meta = await tryOEmbed(url);
  if (meta && meta.title) return res.json(meta);
  meta = await tryCorsProxy(url, 'https://api.allorigins.win/get?url=');
  if (meta && meta.title) return res.json(meta);
  meta = await tryCorsProxy(url, 'https://thingproxy.freeboard.io/fetch/');
  if (meta && meta.title) return res.json(meta);
  meta = await tryPuppeteer(url);
  if (meta && meta.title) return res.json(meta);
  return res.json({ title: '', description: '', thumbnail: '' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Universal metadata extractor running on port ${PORT}`);
}); 