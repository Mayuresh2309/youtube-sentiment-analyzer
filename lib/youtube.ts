const YT_API_BASE = "https://youtube.googleapis.com/youtube/v3"

export function extractVideoId(input: string): string | null {
  try {
    // Support: https://www.youtube.com/watch?v=ID, youtu.be/ID, /embed/ID, and with params
    const u = new URL(input)
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0]
      return id || null
    }
    if (u.searchParams.get("v")) return u.searchParams.get("v")
    const parts = u.pathname.split("/")
    const embedIdx = parts.indexOf("embed")
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1]
    return null
  } catch {
    return null
  }
}

export interface RawComment {
  text: string
  author: string
  publishedAt: string
}

export async function fetchYouTubeComments(opts: {
  videoId: string
  maxComments: number
  includeReplies: boolean
  apiKey: string
}): Promise<RawComment[]> {
  const { videoId, maxComments, includeReplies, apiKey } = opts
  const collected: RawComment[] = []
  let pageToken: string | undefined = undefined

  while (collected.length < maxComments) {
    const params = new URLSearchParams({
      part: includeReplies ? "snippet,replies" : "snippet",
      videoId,
      maxResults: "100",
      ...(pageToken ? { pageToken } : {}),
      key: apiKey,
      order: "time",
      textFormat: "plainText",
    })

    const res = await fetch(`${YT_API_BASE}/commentThreads?${params.toString()}`)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`YouTube API error: ${res.status} ${text}`)
    }
    const data = await res.json()

    for (const item of data.items ?? []) {
      // top-level comment
      const top = item?.snippet?.topLevelComment?.snippet
      if (top?.textOriginal) {
        collected.push({
          text: top.textOriginal as string,
          author: top.authorDisplayName ?? "Unknown",
          publishedAt: top.publishedAt ?? "",
        })
      }
      if (includeReplies && item?.replies?.comments?.length) {
        for (const rep of item.replies.comments) {
          const rs = rep?.snippet
          if (rs?.textOriginal) {
            collected.push({
              text: rs.textOriginal as string,
              author: rs.authorDisplayName ?? "Unknown",
              publishedAt: rs.publishedAt ?? "",
            })
          }
        }
      }
      if (collected.length >= maxComments) break
    }

    pageToken = data.nextPageToken
    if (!pageToken) break
  }

  return collected.slice(0, maxComments)
}
