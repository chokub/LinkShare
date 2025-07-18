const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');

puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());
app.use(cors());

app.post('/api/extract-metadata', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(3000); // รอ JS โหลด
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

      // Fallback: หา <img> ที่ใหญ่ที่สุด
      if (!thumbnail) {
        let maxArea = 0, bestImg = '';
        document.querySelectorAll('img').forEach(img => {
          const src = img.getAttribute('src') || '';
          const width = parseInt(img.getAttribute('width') || '0');
          const height = parseInt(img.getAttribute('height') || '0');
          const area = width * height;
          console.log('FILTER IMG', src, area);
          if (
            src &&
            area > maxArea &&
            !src.startsWith('data:') &&
            !src.includes('unsplash.com') &&
            !src.includes('to-do-doing-done')
          ) {
            maxArea = area;
            bestImg = src;
          }
        });
        if (bestImg) {
          console.log('SELECTED IMG', bestImg);
          thumbnail = bestImg;
        }
      }

      return { title, description, thumbnail };
    });

    await browser.close();
    res.json(meta);
  } catch (e) {
    if (browser) await browser.close();
    console.error('Puppeteer error:', e);
    res.status(500).json({ error: 'Failed to extract metadata', details: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Metadata extractor running on port ${PORT}`);
}); 