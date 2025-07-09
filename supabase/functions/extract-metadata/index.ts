
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetadataResult {
  title: string;
  description: string;
  thumbnail: string;
  platform: string;
  channel_name?: string;
  channel_avatar?: string;
}

function detectPlatform(url: string): string {
  const platformMap: { [key: string]: string } = {
    'youtube.com': 'YouTube',
    'youtu.be': 'YouTube', 
    'instagram.com': 'Instagram',
    'tiktok.com': 'TikTok',
    'facebook.com': 'Facebook',
    'twitter.com': 'Twitter',
    'x.com': 'Twitter'
  };

  for (const [domain, platform] of Object.entries(platformMap)) {
    if (url.includes(domain)) {
      return platform;
    }
  }
  return 'Other';
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractFacebookPostId(url: string): string | null {
  const patterns = [
    /facebook\.com\/.*\/posts\/([^/?]+)/,
    /facebook\.com\/.*\/photos\/.*\/([0-9]+)/,
    /facebook\.com\/photo\.php\?fbid=([0-9]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractInstagramPostId(url: string): string | null {
  const patterns = [
    /instagram\.com\/p\/([^/?]+)/,
    /instagram\.com\/reel\/([^/?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function extractMetadata(url: string): Promise<MetadataResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Title
    let title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="title"]')?.getAttribute('content') ||
      doc.querySelector('title')?.textContent ||
      doc.querySelector('h1')?.textContent ||
      '';

    // Description
    let description =
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="description"]')?.getAttribute('content') ||
      '';

    // Thumbnail
    let thumbnail =
      doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
      '';

    // Fallback: หา <img> ที่ใหญ่ที่สุดในหน้า
    if (!thumbnail) {
      let maxArea = 0;
      let bestImg = '';
      doc.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src') || '';
        const width = parseInt(img.getAttribute('width') || '0');
        const height = parseInt(img.getAttribute('height') || '0');
        const area = width * height;
        if (src && area > maxArea && !src.startsWith('data:')) {
          maxArea = area;
          bestImg = src;
        }
      });
      if (bestImg) thumbnail = bestImg;
    }

    // Clean up
    title = title.trim();
    description = description.trim();
    thumbnail = thumbnail.trim();

    return {
      title,
      description,
      thumbnail,
      platform: '' // หรือจะใส่ autoDetectPlatform(url) ก็ได้
    };
  } catch (e) {
    return {
      title: '',
      description: '',
      thumbnail: '',
      platform: ''
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const metadata = await extractMetadata(url);
    
    return new Response(
      JSON.stringify(metadata),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to extract metadata',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
