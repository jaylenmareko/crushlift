import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export interface ExerciseDemoData {
  name: string
  gifUrl: string
  bodyPart: string
  target: string
  equipment: string
  secondaryMuscles: string[]
  instructions: string[]
}

// L1: in-memory (fastest, lives for server process lifetime)
const memCache = new Map<string, ExerciseDemoData>()

// L2: Supabase exercise_demos table (persists across restarts, never expires)
// L3: ExerciseDB API (only hit when neither cache has the exercise)

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

  const key = name.toLowerCase().trim()

  // L1 — memory
  if (memCache.has(key)) return NextResponse.json(memCache.get(key))

  // L2 — Supabase
  try {
    const { data: row } = await supabase()
      .from('exercise_demos')
      .select('*')
      .eq('name', key)
      .maybeSingle()

    if (row) {
      const result: ExerciseDemoData = {
        name: row.name,
        gifUrl: row.gif_url,
        bodyPart: row.body_part,
        target: row.target,
        equipment: row.equipment,
        secondaryMuscles: row.secondary_muscles ?? [],
        instructions: row.instructions ?? [],
      }
      memCache.set(key, result)
      return NextResponse.json(result)
    }
  } catch {
    // Supabase unavailable — fall through to API
  }

  // L3 — ExerciseDB API
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return NextResponse.json({ error: 'no_key' }, { status: 503 })

  const res = await fetch(
    `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(key)}?limit=3&offset=0`,
    { headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com' } }
  )

  if (!res.ok) return NextResponse.json({ error: 'api_error' }, { status: res.status })

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const ex = data[0]
  const result: ExerciseDemoData = {
    name: key,
    gifUrl: ex.gifUrl,
    bodyPart: ex.bodyPart,
    target: ex.target,
    equipment: ex.equipment,
    secondaryMuscles: ex.secondaryMuscles ?? [],
    instructions: ex.instructions ?? [],
  }

  // Write to Supabase + memory (fire-and-forget, don't block response)
  supabase()
    .from('exercise_demos')
    .upsert({
      name: key,
      gif_url: result.gifUrl,
      body_part: result.bodyPart,
      target: result.target,
      equipment: result.equipment,
      secondary_muscles: result.secondaryMuscles,
      instructions: result.instructions,
    }, { onConflict: 'name' })
    .then()
    .catch(() => {})

  memCache.set(key, result)
  return NextResponse.json(result)
}
