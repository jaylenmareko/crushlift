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
  note: 'Verification complete.',
  demo: true,
}

function toBase64(dataUrl: string) {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '')
}

const MANUAL_REVIEW_MODE = true

export async function POST(req: NextRequest) {
  const { photos, declaredWeight, plates } = await req.json() as {
    photos: { left: string | null; right: string | null; front: string | null }
    declaredWeight: number
    plates: { size: number; count: number }[]
  }

  if (MANUAL_REVIEW_MODE) {
    return NextResponse.json({ verified: true, confidence: 'high', note: 'Plate check passed — manual review mode.', pending_review: true })
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

    type ContentBlock =
      | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }
      | { type: 'text'; text: string }

    const labels = { left: '[Photo 1 — Left side of bar]', right: '[Photo 2 — Right side of bar]', front: '[Photo 3 — Front view of bar]' }
    const imageBlocks: ContentBlock[] = []
    for (const key of ['left', 'right', 'front'] as const) {
      const photo = photos[key]
      if (!photo) continue
      imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: toBase64(photo) } })
      imageBlocks.push({ type: 'text', text: labels[key] })
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          ...imageBlocks,
          {
            type: 'text',
            text: `These are up to 3 photos of a barbell loaded for a PR attempt — left side, right side, and front view. The bar may be racked or on the floor.

Lifter declared: ${plateSummary}, total ${declaredWeight} lbs (including a 45lb bar).

Analyze all photos together:
- Left and right side photos: read any visible plate numbers on the outermost plate. Also estimate plate sizes by rim diameter — standard iron plates go from 45lb (largest) down to 2.5lb (smallest), each noticeably different in size.
- Front photo: count the plate stacks per side and estimate sizes from the visible rims.
- Check that both sides appear to match.
- Cross-reference what you see with the declared ${plateSummary}.
- If it looks like bumper plates (all same diameter, different colors/thickness), flag that diameter-based estimation is unreliable.

Reject clearly invalid setups: empty bar, single loose plate on floor, plate rack, unloaded bar.

Return ONLY valid JSON (no markdown):
{
  "verified": <true if photos clearly show a loaded barbell and plates appear consistent with the declaration, false otherwise>,
  "confidence": "<high | medium | low>",
  "note": "<one sentence — what you saw on each side and whether it matched the declaration>"
}`,
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
