import { createClient } from '@/lib/supabase/client'

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const binary = atob(data)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export async function uploadPrSession(params: {
  userId: string
  exerciseName: string
  declaredWeight: number | null
  declaredReps: number | null
  verified: boolean
  confidence: string
  aiNote: string
  platePhotos: { left: string | null; right: string | null; front: string | null } | null
  videoBlob: Blob | null
}) {
  const supabase = createClient()
  const sessionId = Date.now().toString()
  const base = `${params.userId}/${sessionId}`

  const platePhotoPaths: Record<string, string> = {}
  let liftVideoPath: string | null = null

  // Upload plate photos
  if (params.platePhotos) {
    for (const [side, dataUrl] of Object.entries(params.platePhotos)) {
      if (!dataUrl) continue
      const path = `${base}/plate-${side}.jpg`
      const { error } = await supabase.storage
        .from('pr-media')
        .upload(path, dataUrlToBlob(dataUrl), { contentType: 'image/jpeg', upsert: true })
      if (!error) platePhotoPaths[side] = path
    }
  }

  // Upload video
  if (params.videoBlob && params.videoBlob.size > 0) {
    const ext = params.videoBlob.type.includes('mp4') ? 'mp4' : 'webm'
    const path = `${base}/lift.${ext}`
    const { error } = await supabase.storage
      .from('pr-media')
      .upload(path, params.videoBlob, { contentType: params.videoBlob.type, upsert: true })
    if (!error) liftVideoPath = path
  }

  // Save record
  await supabase.from('pr_verifications').insert({
    user_id: params.userId,
    exercise_name: params.exerciseName,
    declared_weight: params.declaredWeight,
    declared_reps: params.declaredReps,
    verified: params.verified,
    confidence: params.confidence,
    ai_note: params.aiNote,
    plate_photos: Object.keys(platePhotoPaths).length > 0 ? platePhotoPaths : null,
    lift_video_url: liftVideoPath,
  })

  // Recompute belt ranks in the background whenever a verified PR lands
  if (params.verified) {
    fetch('/api/compute-rank', { method: 'POST' }).catch(() => {})
  }
}
