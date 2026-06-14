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
  note: 'Added weight matches your declared amount.',
  demo: true,
}

export async function POST(req: NextRequest) {
  const { photo, declaredWeight, liftName } = await req.json() as {
    photo: string
    declaredWeight: number
    liftName: string
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(DEMO_RESULT)
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
            text: `This photo is supposed to show the added weight for a weighted ${liftName} — typically a weight plate or dumbbell hanging from a dip belt or weight chain.

The lifter declared ${declaredWeight} lbs of added weight.

First check: does the photo actually show weight attached to a dip belt, chain, or vest setup? Reject photos of an empty belt, a plate sitting somewhere unattached, or anything that isn't the actual loaded setup.

If it does show the loaded setup, look at the markings on the plates/dumbbell and check whether the visible weight is consistent with the declared ${declaredWeight} lbs.

Return ONLY valid JSON (no markdown, no explanation):
{
  "verified": <true only if this clearly shows weight attached to a belt/chain AND the visible weight plausibly matches the declaration, false otherwise>,
  "confidence": "<high | medium | low>",
  "note": "<one short sentence explaining what you saw — call out if it doesn't look like an attached weight setup>"
}

If the photo is blurry, too far away, doesn't show an attached weight setup, or the weight isn't clearly readable, set confidence to "low" and verified to false.`,
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
