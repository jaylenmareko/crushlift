import { NextRequest, NextResponse } from 'next/server'

interface VerifyResult {
  verified: boolean
  confidence: 'high' | 'medium' | 'low'
  note: string
  demo?: boolean
}

const DEMO_RESULT: VerifyResult = {
  verified: true,
  confidence: 'high',
  note: 'Plate numbers match your declared weight.',
  demo: true,
}

export async function POST(req: NextRequest) {
  const { photo, declaredWeight, plates } = await req.json() as {
    photo: string
    declaredWeight: number
    plates: { size: number; count: number }[]
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(DEMO_RESULT)
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const plateSummary = plates
      .filter(p => p.count > 0)
      .map(p => `${p.count}x ${p.size}lb per side`)
      .join(', ') || 'no plates (bar only)'

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: 'image/jpeg' as const,
              data: photo.replace(/^data:image\/\w+;base64,/, ''),
            },
          },
          {
            type: 'text',
            text: `This photo is supposed to show a barbell loaded with weight plates, ready for a PR attempt.

The lifter declared: ${plateSummary}, for a total of ${declaredWeight} lbs (including a 45lb bar).

First check: does the photo actually show a barbell with plates loaded on its sleeve? Reject photos of a single plate sitting on the floor, a plate rack, an empty bar, or anything that isn't the assembled bar+plates setup.

If it does show a loaded bar, look at the numbers/markings printed on the plates and check whether what you see is consistent with the declared plates.

Return ONLY valid JSON (no markdown, no explanation):
{
  "verified": <true only if this is clearly a loaded barbell AND the visible plates plausibly match the declaration, false otherwise>,
  "confidence": "<high | medium | low>",
  "note": "<one short sentence explaining what you saw — call out if it doesn't look like a loaded bar>"
}

If the photo is blurry, too far away, doesn't show a barbell, or plates aren't clearly readable, set confidence to "low" and verified to false.`,
          },
        ],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    let result: VerifyResult
    try {
      result = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) return NextResponse.json(DEMO_RESULT)
      result = JSON.parse(match[0])
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(DEMO_RESULT)
  }
}
