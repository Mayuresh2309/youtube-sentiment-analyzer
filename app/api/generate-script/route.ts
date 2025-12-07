import { generateVideoScript } from "@/lib/script-generator"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { topicIdea, commentContext } = await request.json()

    if (!topicIdea) {
      return NextResponse.json({ error: "Topic idea is required" }, { status: 400 })
    }

    const script = await generateVideoScript(topicIdea, commentContext || "General audience feedback")

    return NextResponse.json(script)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Failed to generate script" }, { status: 500 })
  }
}
