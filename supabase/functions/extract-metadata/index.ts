
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
  console.log(`Extracting metadata for: ${url}`);
  
  const platform = detectPlatform(url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // Extract title with priority order and better cleaning
    let title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
                doc.querySelector('title')?.textContent ||
                '';
    
    // Enhanced title cleaning for all platforms
    title = title.replace(/ - YouTube$/, '')
                 .replace(/ \| Instagram$/, '')
                 .replace(/ \| TikTok$/, '')
                 .replace(/ \| Facebook$/, '')
                 .replace(/ \| Twitter$/, '')
                 .replace(/ on Instagram: ".*"$/, '')
                 .replace(/ • Instagram$/, '')
                 .replace(/^\(.*\) /, '') // Remove leading parentheses content
                 .trim();
    
    // Extract description with better fallbacks
    const description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                       doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
                       doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                       doc.querySelector('meta[property="description"]')?.getAttribute('content') ||
                       '';
    
    // Initialize result object
    const result: MetadataResult = {
      title: '',
      description: '',
      thumbnail: '',
      platform,
      channel_name: undefined,
      channel_avatar: undefined
    };
    
    // Platform-specific extraction
    if (platform === 'YouTube') {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        // YouTube thumbnail
        const thumbnailOptions = [
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        ];
        result.thumbnail = thumbnailOptions[0];
        
        // Extract channel information
        const channelName = doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
                           doc.querySelector('link[itemprop="name"]')?.getAttribute('content') ||
                           doc.querySelector('span[itemprop="author"] link[itemprop="name"]')?.getAttribute('content') ||
                           '';
        
        if (channelName) {
          result.channel_name = channelName;
          // Channel avatar - try to extract from page or use YouTube default
          const channelAvatar = doc.querySelector('link[itemprop="thumbnailUrl"]')?.getAttribute('href') ||
                               doc.querySelector('img[class*="channel"]')?.getAttribute('src') ||
                               `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`;
          result.channel_avatar = channelAvatar;
        }
      }
    } else if (platform === 'Facebook') {
      // Better Facebook thumbnail extraction
      let fbThumbnail = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                       doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                       '';
      
      // For Facebook, try to get the actual post image instead of profile picture
      const postImages = doc.querySelectorAll('img[src*="scontent"]');
      if (postImages.length > 0) {
        const largestImage = Array.from(postImages).find(img => {
          const src = img.getAttribute('src') || '';
          return src.includes('scontent') && !src.includes('p50x50') && !src.includes('p40x40');
        });
        if (largestImage) {
          fbThumbnail = largestImage.getAttribute('src') || fbThumbnail;
        }
      }
      
      result.thumbnail = fbThumbnail;
    } else if (platform === 'Instagram') {
      // Better Instagram thumbnail extraction
      let igThumbnail = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                       doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                       '';
      
      // For Instagram, try to get the actual post image
      const postImages = doc.querySelectorAll('img[src*="cdninstagram"]');
      if (postImages.length > 0) {
        const postImage = Array.from(postImages).find(img => {
          const src = img.getAttribute('src') || '';
          return src.includes('cdninstagram') && !src.includes('150x150') && !src.includes('44x44');
        });
        if (postImage) {
          igThumbnail = postImage.getAttribute('src') || igThumbnail;
        }
      }
      
      result.thumbnail = igThumbnail;
    }
    
    // Fallback to og:image if platform-specific method didn't work
    if (!result.thumbnail) {
      result.thumbnail = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                        doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                        doc.querySelector('meta[name="twitter:image:src"]')?.getAttribute('content') ||
                        '';
    }
    
    // Ensure thumbnail has protocol
    if (result.thumbnail && result.thumbnail.startsWith('//')) {
      result.thumbnail = `https:${result.thumbnail}`;
    } else if (result.thumbnail && !result.thumbnail.startsWith('http')) {
      result.thumbnail = `https://${result.thumbnail}`;
    }
    
    // Final fallback
    if (!result.thumbnail) {
      result.thumbnail = 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop&q=60';
    }
    
    // Set final values
    result.title = title || 'ไม่สามารถดึงชื่อเรื่องได้';
    result.description = description || 'ไม่สามารถดึงคำอธิบายได้';
    
    console.log('Extracted metadata:', { 
      title: result.title.substring(0, 100), 
      description: result.description.substring(0, 100), 
      thumbnail: result.thumbnail, 
      platform: result.platform,
      channel_name: result.channel_name,
      channel_avatar: result.channel_avatar
    });
    
    return result;
    
  } catch (error) {
    console.error('Metadata extraction error:', error);
    
    // Fallback with basic info
    return {
      title: 'ไม่สามารถดึงชื่อเรื่องได้',
      description: 'ไม่สามารถดึงคำอธิบายได้',
      thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop&q=60',
      platform
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
