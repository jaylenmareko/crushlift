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

// Module-level cache — exercise data never changes, so never invalidate.
// One API call per unique exercise name for the lifetime of the server process.
const cache = new Map<string, ExerciseDemoData>()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

  const key = name.toLowerCase().trim()

  if (cache.has(key)) {
    return NextResponse.json(cache.get(key))
  }

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return NextResponse.json({ error: 'no_key' }, { status: 503 })

  const res = await fetch(
    `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(key)}?limit=3&offset=0`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      },
    }
  )

  if (!res.ok) return NextResponse.json({ error: 'api_error' }, { status: res.status })

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const ex = data[0]
  const result: ExerciseDemoData = {
    name: ex.name,
    gifUrl: ex.gifUrl,
    bodyPart: ex.bodyPart,
    target: ex.target,
    equipment: ex.equipment,
    secondaryMuscles: ex.secondaryMuscles ?? [],
    instructions: ex.instructions ?? [],
  }

  cache.set(key, result)
  return NextResponse.json(result)
}
