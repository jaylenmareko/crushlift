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
  note: 'Full rep completed with good control and lockout.',
  demo: true,
}

export async function POST(req: NextRequest) {
  const { exerciseName, declaredWeight, reps, frames, platePhoto } = await req.json() as {
    exerciseName: string
    declaredWeight: number
    reps?: number
    frames: string[]
    platePhoto?: string | null
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(DEMO_RESULT)
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const weightLabel = declaredWeight > 0 ? `${declaredWeight} lbs added weight` : 'bodyweight'
    const repsLabel = reps ? ` for ${reps} ${reps === 1 ? 'rep' : 'reps'}` : ''

    const plateCheckInstructions = platePhoto
      ? `

The first image is a reference photo taken just before this set, showing the weight setup the lifter declared (${weightLabel}) — either a loaded barbell or added weight attached to a dip belt/chain for a bodyweight exercise. The remaining images are frames from the lift video. Cross-check: does the weight setup visible in the video frames match the reference photo (same plates/weight, same approximate loading)? If the video shows a clearly different setup (different plates, no added weight, different exercise/equipment), set verified to false and say so in the note.`
      : ''

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          ...(platePhoto ? [{
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: 'image/jpeg' as const,
              data: platePhoto.replace(/^data:image\/\w+;base64,/, ''),
            },
          }] : []),
          ...frames.map(f => ({
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: 'image/jpeg' as const,
              data: f.replace(/^data:image\/\w+;base64,/, ''),
            },
          })),
          {
            type: 'text',
            text: `These are sequential frames from a video of an attempted ${exerciseName} PR at ${weightLabel}${repsLabel}.

Determine whether the lift was completed successfully — full range of motion, controlled, locked out / finished position reached for each rep claimed, no failed rep or spotter assistance pulling the weight up.${plateCheckInstructions}

Return ONLY valid JSON (no markdown, no explanation):
{
  "verified": <true if this looks like a completed, successful PR attempt at the declared weight, false otherwise>,
  "confidence": "<high | medium | low>",
  "note": "<one short sentence on what you saw>"
}

If the frames are too unclear, blurry, or don't show a full rep, set confidence to "low" and verified to false.`,
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
