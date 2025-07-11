import got from 'got';
import metascraper from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperImage from 'metascraper-image';
import metascraperDescription from 'metascraper-description';

const scraper = metascraper([
  metascraperTitle(),
  metascraperImage(),
  metascraperDescription(),
]);

export function detectPlatform(url: string): string {
  const patterns: Record<string, RegExp> = {
    youtube: /youtube\.com|youtu\.be/,
    tiktok: /tiktok\.com/,
    twitch: /twitch\.tv/,
    shopee: /shopee\./,
    lazada: /lazada\./,
    twitter: /twitter\.com|x\.com/,
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) return platform;
  }
  return 'other';
}

export async function extractMetadata(url: string) {
  try {
    const { body: html } = await got(url);
    const data = await scraper({ html, url });
    const platform = detectPlatform(url);

    return {
      title: data.title || 'ไม่มีชื่อ',
      description: data.description || '',
      image: data.image || '',
      url,
      platform,
    };
  } catch (error) {
    const platform = detectPlatform(url);
    return {
      title: platform,
      description: '',
      image: '',
      url,
      platform,
    };
  }
} 