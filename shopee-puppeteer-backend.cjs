const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function extractTitleFromShopeeUrl(url) {
  try {
    const u = new URL(url);
    const slug = decodeURIComponent(u.pathname.split('/')[1] || '');
    const titlePart = slug.replace(/-i\.[0-9]+\.[0-9]+$/, '');
    return titlePart.replace(/-/g, ' ').trim();
  } catch {
    return '';
  }
}

app.post('/api/shopee-scrape', async (req, res) => {
  const { url } = req.body;
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // รอ selector ของรูปสินค้าหลัก (อาจต้องปรับ selector ตาม Shopee ปัจจุบัน)
    await page.waitForSelector('img', { timeout: 10000 });

    // ดึง og:title, og:image
    const meta = await page.evaluate(() => {
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
      const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
      return { ogTitle, ogImage };
    });

    // fallback หา img หลักในหน้า
    let mainImg = meta.ogImage;
    if (!mainImg) {
      mainImg = await page.evaluate(() => {
        // อาจต้องปรับ selector ให้ตรงกับรูปสินค้าหลัก
        const img = document.querySelector('img');
        return img ? img.src : null;
      });
    }

    let title = meta.ogTitle;
    if (!title || title.trim() === '' || title === 'Shopee') {
      title = extractTitleFromShopeeUrl(url);
    }

    // log title และ mainImg
    console.log('Shopee puppeteer result:', { title, mainImg });

    res.json({
      title: title || null,
      image: mainImg || null,
      platform: "Shopee",
      url
    });
  } catch (err) {
    res.json({
      title: extractTitleFromShopeeUrl(url),
      image: null,
      platform: "Shopee",
      url,
      error: err.message
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Shopee puppeteer backend listening at http://localhost:${PORT}`);
}); 