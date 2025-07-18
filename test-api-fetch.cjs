const fetch = require('node-fetch');

const url = process.argv[2];
if (!url) {
  console.log('Usage: node test-api-fetch.cjs <url>');
  process.exit(1);
}

let api = '';
if (/shopee\.co\.th\//.test(url)) {
  api = 'http://localhost:3001/api/shopee-scrape';
} else if (/facebook\.com\//.test(url)) {
  api = 'http://localhost:3001/api/fb-scrape';
} else if (/youtube\.com|youtu\.be/.test(url)) {
  api = 'http://localhost:3001/api/youtube-oembed'; // สมมติว่ามี endpoint นี้
} else {
  api = 'http://localhost:3001/api/extract-metadata';
}

console.log('Testing API:', api);

fetch(api, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url })
})
  .then(res => res.json())
  .then(data => {
    console.log('API result:', data);
  })
  .catch(err => {
    console.error('Error:', err);
  }); 