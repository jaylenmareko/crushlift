import { NextRequest, NextResponse } from 'next/server'

export interface ExerciseDemoData {
  name: string
  gifUrl: string
  bodyPart: string
  target: string
  equipment: string
  secondaryMuscles: string[]
  instructions: string[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return NextResponse.json({ error: 'no_key' }, { status: 503 })

  const res = await fetch(
    `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name.toLowerCase())}?limit=3&offset=0`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      },
      next: { revalidate: 86400 }, // cache 24h — exercise data never changes
    }
  )

  if (!res.ok) return NextResponse.json({ error: 'api_error' }, { status: res.status })

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const ex = data[0]
  return NextResponse.json({
    name: ex.name,
    gifUrl: ex.gifUrl,
    bodyPart: ex.bodyPart,
    target: ex.target,
    equipment: ex.equipment,
    secondaryMuscles: ex.secondaryMuscles ?? [],
    instructions: ex.instructions ?? [],
  } satisfies ExerciseDemoData)
}
