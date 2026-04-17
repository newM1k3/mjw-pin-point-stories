import type { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const { locationName, lenses } = JSON.parse(event.body || '{}');

    if (!locationName || !lenses || !Array.isArray(lenses)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing locationName or lenses' }),
      };
    }

    const systemPrompt = `You are a gifted travel writer crafting a personal, evocative memory of a specific place. Write a travel story of exactly 250 to 300 words about the provided location. The traveler's perspective is filtered through specific lenses. Write in second-person ("you"). Open with a vivid, sensory detail. Weave the lenses naturally into the narrative without listing them. End with a single sentence that lingers. Do NOT use generic travel clichés. Do NOT write a Wikipedia-style summary.`;

    const userPrompt = `Location: ${locationName}\nLenses: ${lenses.join(', ')}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      throw new Error('Anthropic API error');
    }

    const data = await response.json();
    const story = data.content?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ story }),
    };
  } catch (err) {
    console.error('generate-story error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
