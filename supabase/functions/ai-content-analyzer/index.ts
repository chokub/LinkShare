
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, title, description, action } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`AI Analysis request - Action: ${action}, URL: ${url}`);

    let prompt = '';
    let systemPrompt = '';

    if (action === 'summary') {
      systemPrompt = 'คุณเป็น AI ที่ช่วยสรุปเนื้อหาเป็นภาษาไทย โดยสรุปให้กระชับ เข้าใจง่าย และมีประโยชน์';
      prompt = `กรุณาสรุปเนื้อหานี้ให้กระชับในประมาณ 2-3 ประโยค:
ชื่อเรื่อง: ${title}
คำอธิบาย: ${description}
ลิงก์: ${url}`;
    } else if (action === 'tags') {
      systemPrompt = 'คุณเป็น AI ที่ช่วยแนะนำ tags สำหรับ bookmark โดยให้ tags ที่เกี่ยวข้องและมีประโยชน์ในภาษาไทย';
      prompt = `กรุณาแนะนำ tags ที่เหมาะสมสำหรับเนื้อหานี้ (3-5 tags) ในภาษาไทย:
ชื่อเรื่อง: ${title}
คำอธิบาย: ${description}
ลิงก์: ${url}

กรุณาตอบเป็น JSON array ของ strings เท่านั้น เช่น ["แท็ก1", "แท็ก2", "แท็ก3"]`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    console.log(`AI Analysis result for ${action}:`, result.substring(0, 100));

    let processedResult;
    if (action === 'tags') {
      try {
        processedResult = JSON.parse(result);
      } catch (parseError) {
        console.log('Failed to parse JSON, trying to extract tags manually');
        // Fallback if JSON parsing fails
        const cleanResult = result.replace(/```json|```/g, '').trim();
        try {
          processedResult = JSON.parse(cleanResult);
        } catch {
          // Last resort: split by common separators
          processedResult = result.split(/[,\n]/).map((tag: string) => 
            tag.trim().replace(/['"[\]]/g, '')
          ).filter((tag: string) => tag.length > 0).slice(0, 5);
        }
      }
    } else {
      processedResult = result;
    }

    return new Response(JSON.stringify({ result: processedResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-content-analyzer:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more details'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
