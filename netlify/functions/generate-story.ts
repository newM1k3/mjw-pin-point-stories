import type { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Request body shape sent from StoryPanel.generateStory().
 * All fields beyond locationName and lenses are optional — the function
 * degrades gracefully if the client sends only the legacy two-field payload.
 */
interface GenerateStoryRequest {
  locationName: string;
  lenses: string[];
  /** Number of photos taken at this stop. */
  photoCount?: number;
  /** ISO date string of the earliest photo at this stop. */
  dateStart?: string;
  /** ISO date string of the latest photo at this stop. */
  dateEnd?: string;
  /** Hours spent at this stop (derived from first/last photo timestamps). */
  durationHours?: number;
  /** 1-based index of this stop within the trip. */
  stopIndex?: number;
  /** Total number of stops in the trip. */
  totalStops?: number;
  /** Human-readable trip name entered by the user. */
  tripName?: string;
}

/** Format a duration in hours into a readable string, e.g. "3 hours", "half a day", "2 days". */
function formatDuration(hours: number): string {
  if (hours < 1) return 'less than an hour';
  if (hours < 2) return 'about an hour';
  if (hours < 5) return `${Math.round(hours)} hours`;
  if (hours < 10) return 'half a day';
  if (hours < 20) return 'a full day';
  if (hours < 36) return 'about a day and a half';
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

/** Format a date string into a readable form, e.g. "Tuesday, 14 March 2023". */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const body: GenerateStoryRequest = JSON.parse(event.body || '{}');
    const {
      locationName,
      lenses,
      photoCount,
      dateStart,
      dateEnd,
      durationHours,
      stopIndex,
      totalStops,
      tripName,
    } = body;

    if (!locationName || !lenses || !Array.isArray(lenses) || lenses.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing locationName or lenses' }),
      };
    }

    // ── System prompt ────────────────────────────────────────────────────────
    const systemPrompt = `You are a gifted travel writer crafting a deeply personal, evocative memory of a specific place. Your task is to write a travel story of exactly 250 to 300 words.

Style rules:
- Write in second-person ("you") throughout.
- Open with a vivid, specific sensory detail — a smell, a sound, a texture, a quality of light — that anchors the reader immediately in the place.
- Weave the traveler's lenses naturally into the narrative. Never list them. Never announce them. Let them shape the mood and detail instead.
- When time context is provided, let it breathe into the story — the slant of afternoon light, the particular stillness of a Tuesday morning, the exhaustion of a third day on the road.
- When photo count is provided, let it hint at the intensity of attention — a single photo suggests a glance; fifty suggests obsession.
- When the stop is one of many in a trip, let the story carry a sense of movement — of arriving from somewhere and heading somewhere else.
- End with a single sentence that lingers: an image, a feeling, or a question that stays with the reader after the story ends.

Strict prohibitions:
- No generic travel clichés ("hidden gem", "bustling streets", "rich tapestry", "vibrant culture").
- No Wikipedia-style geographical or historical summaries.
- No lists. No bullet points. No headers.
- Do not mention the word "memories" or "unforgettable".
- Do not exceed 300 words or fall below 250 words.`;

    // ── User prompt — build contextual lines only when data is present ────────
    const lines: string[] = [`Location: ${locationName}`];

    if (tripName) {
      lines.push(`Trip: ${tripName}`);
    }

    if (stopIndex !== undefined && totalStops !== undefined) {
      const ordinal = (n: number) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };
      lines.push(`Stop: ${ordinal(stopIndex)} of ${totalStops} on this trip`);
    }

    if (dateStart) {
      const dateLabel = dateEnd && dateEnd !== dateStart
        ? `${formatDate(dateStart)} to ${formatDate(dateEnd)}`
        : formatDate(dateStart);
      lines.push(`Date: ${dateLabel}`);
    }

    if (durationHours !== undefined && durationHours > 0) {
      lines.push(`Time spent here: ${formatDuration(durationHours)}`);
    }

    if (photoCount !== undefined) {
      lines.push(`Photos taken: ${photoCount}`);
    }

    lines.push(`Traveler's lenses: ${lenses.join(', ')}`);

    const userPrompt = lines.join('\n');

    // ── Claude API call ───────────────────────────────────────────────────────
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
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
    const story = data.content?.[0]?.text?.trim() || '';

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
