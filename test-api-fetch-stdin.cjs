console.log('Paste a URL (Shopee, Facebook, YouTube, etc.) and press Enter:');

process.stdin.setEncoding('utf8');
process.stdin.on('data', (input) => {
  const url = input.trim();
  if (!url) return;

  let api = '';
  if (/shopee\.co\.th\//.test(url)) {
    api = 'http://localhost:3001/api/shopee-scrape';
  } else if (/facebook\.com\//.test(url)) {
    api = 'http://localhost:3001/api/fb-scrape';
  } else if (/youtube\.com|youtu\.be/.test(url)) {
    api = 'http://localhost:3001/api/youtube-oembed';
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
      console.log('\nPaste another URL or Ctrl+C to exit:');
    })
    .catch(err => {
      console.error('Error:', err);
      console.log('\nPaste another URL or Ctrl+C to exit:');
    });
}); 