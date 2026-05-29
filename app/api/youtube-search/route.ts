import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'YouTube API not configured' }, { status: 500 })

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' proper form tutorial')}&type=video&maxResults=1&key=${apiKey}`

  const res = await fetch(url)
  const data = await res.json()

  if (!data.items?.length) return NextResponse.json({ videoId: null })

  const item = data.items[0]
  return NextResponse.json({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
  })
}
