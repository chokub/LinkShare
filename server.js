const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

async function scrapeWithPuppeteer(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // ดึง meta tag
  const title = await page.$eval('meta[property="og:title"]', el => el.content).catch(() => '');
  const description = await page.$eval('meta[property="og:description"]', el => el.content).catch(() => '');
  const image = await page.$eval('meta[property="og:image"]', el => el.content).catch(() => '');
  await browser.close();
  return { title, description, image };
}

app.post('/api/fb-scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    // พยายามดึงด้วย axios+cheerio ก่อน
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      }
    });
    const $ = cheerio.load(data);
    let title = $('meta[property="og:title"]').attr('content') || '';
    let description = $('meta[property="og:description"]').attr('content') || '';
    let image = $('meta[property="og:image"]').attr('content') || '';

    // ถ้าไม่ได้ข้อมูล ลอง puppeteer
    if (!title && !description && !image) {
      const result = await scrapeWithPuppeteer(url);
      title = result.title;
      description = result.description;
      image = result.image;
    }

    res.json({
      title,
      description,
      image,
      platform: 'Facebook'
    });
  } catch (err) {
    // ถ้า axios ล้มเหลว ลอง puppeteer
    try {
      const result = await scrapeWithPuppeteer(url);
      res.json({
        title: result.title,
        description: result.description,
        image: result.image,
        platform: 'Facebook'
      });
    } catch (err2) {
      res.status(500).json({ error: 'Failed to fetch Facebook post', detail: err2.message });
    }
  }
});

app.post('/api/shopee-scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      }
    });
    const $ = cheerio.load(data);
    const title = $('meta[property="og:title"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || '';
    // Shopee มักจะมีราคาใน meta tag หรือใน script
    let price = '';
    // ลองดึงจาก meta
    price = $('meta[property="product:price:amount"]').attr('content') || '';
    // ถ้าไม่ได้ ลองดึงจาก script (optional)
    if (!price) {
      const script = $('script[type="application/ld+json"]').html();
      if (script) {
        try {
          const json = JSON.parse(script);
          price = json.offers?.price || '';
        } catch {}
      }
    }
    res.json({ title, image, price, platform: 'Shopee' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Shopee product', detail: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`FB Scraper API running on http://localhost:${PORT}`);
}); 