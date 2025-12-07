import { NextResponse } from "next/server"
import { extractVideoId, fetchYouTubeComments } from "@/lib/youtube"
import {
  analyzeSentiment,
  extractTopics,
  suggestTopics,
  suggestTopicsEnhanced,
  suggestTopicsIntentDriven,
} from "@/lib/sentiment"

export async function POST(req: Request) {
  try {
    const { url, maxComments = 100, includeReplies = false } = await req.json()

    if (!url || typeof url !== "string") {
      return new NextResponse("Invalid or missing URL", { status: 400 })
    }
    const videoId = extractVideoId(url)
    if (!videoId) {
      return new NextResponse("Could not parse video ID from URL", { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return new NextResponse("Server is missing YOUTUBE_API_KEY", { status: 500 })
    }

    const raw = await fetchYouTubeComments({
      videoId,
      maxComments: Math.min(1000, Math.max(1, Number(maxComments) || 100)),
      includeReplies: !!includeReplies,
      apiKey,
    })

    const analyzed = raw.map((c) => {
      const { label, score } = analyzeSentiment(c.text)
      return {
        text: c.text,
        author: c.author,
        publishedAt: c.publishedAt,
        sentiment: label,
        score,
      }
    })

    const counts = analyzed.reduce(
      (acc, c) => {
        acc[c.sentiment]++
        return acc
      },
      { positive: 0, neutral: 0, negative: 0 } as { positive: number; neutral: number; negative: number },
    )

    const allTexts = analyzed.map((c) => c.text)
    const { technologies, actions, phrases, questions } = extractTopics(allTexts)

    const intentDriven = suggestTopicsIntentDriven(
      analyzed.map((c) => ({ text: c.text, sentiment: c.sentiment })),
      6,
    )
    const enhanced =
      intentDriven.length < 6
        ? suggestTopicsEnhanced(
            analyzed.map((c) => ({ text: c.text, sentiment: c.sentiment })),
            6,
          )
        : []

    const classic =
      intentDriven.length + enhanced.length < 6 ? suggestTopics(technologies, actions, phrases, questions, 6) : []

    const suggestions = [...intentDriven, ...enhanced, ...classic].slice(0, 6)

    return NextResponse.json({
      comments: analyzed,
      counts,
      suggestions,
    })
  } catch (err: any) {
    console.error("[v0] analyze error:", err?.message || err)
    return new NextResponse(err?.message || "Unexpected error", { status: 500 })
  }
}
