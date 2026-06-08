import { NextRequest, NextResponse } from 'next/server'

interface AnalysisResult {
  score: number
  strengths: string[]
  corrections: string[]
  tip: string
  demo?: boolean
}

const DEMO_RESULT: AnalysisResult = {
  score: 74,
  strengths: ['Controlled tempo on the descent', 'Neutral spine maintained'],
  corrections: ['Elbows flaring slightly — tuck them in 15-20°', 'Full range of motion — go deeper on each rep'],
  tip: 'Brace your core like you\'re about to take a punch before each rep.',
  demo: true,
}

export async function POST(req: NextRequest) {
  const { exerciseName, frames } = await req.json() as { exerciseName: string; frames: string[] }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(DEMO_RESULT)
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const imageContent = (frames as string[]).slice(0, 4).map(frame => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg' as const,
        data: frame.replace(/^data:image\/\w+;base64,/, ''),
      },
    }))

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `You are an elite personal trainer analyzing exercise form. Exercise being performed: ${exerciseName}

Look at these frames from the workout video and analyze the form.

Return ONLY valid JSON (no markdown, no explanation):
{
  "score": <integer 0-100>,
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "corrections": ["<specific correction 1>", "<specific correction 2>"],
  "tip": "<one short actionable coaching cue>"
}

Score guide: 90-100 = elite form, 75-89 = solid with minor tweaks, 60-74 = noticeable issues, below 60 = significant form breakdown.
Be specific to ${exerciseName}. If you cannot see the movement clearly, note that in corrections.`,
          },
        ],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    let result: AnalysisResult
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
