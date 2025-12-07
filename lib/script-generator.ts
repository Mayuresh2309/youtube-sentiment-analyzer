export interface VideoScript {
  title: string
  description: string
  duration: string
  sections: ScriptSection[]
  talkingPoints: string[]
  thumbnailIdeas: string[]
  seoKeywords: string[]
}

export interface ScriptSection {
  title: string
  duration: string
  content: string
  tips: string[]
}

export async function generateVideoScript(topicIdea: string, commentContext: string): Promise<VideoScript> {
  const prompt = `You are an expert YouTube content creator and video scriptwriter. Based on the following topic idea and viewer comments context, generate a detailed, engaging video script.

Topic Idea: ${topicIdea}
Viewer Context: ${commentContext}

Generate a comprehensive video script in JSON format with the following structure:
{
  "title": "Catchy, SEO-friendly video title",
  "description": "Detailed YouTube description (150-200 words)",
  "duration": "Estimated video duration (e.g., '12-15 minutes')",
  "sections": [
    {
      "title": "Section name",
      "duration": "Time for this section",
      "content": "Detailed script for this section",
      "tips": ["Tip 1", "Tip 2", "Tip 3"]
    }
  ],
  "talkingPoints": ["Point 1", "Point 2", "Point 3", ...],
  "thumbnailIdeas": ["Thumbnail idea 1", "Thumbnail idea 2", "Thumbnail idea 3"],
  "seoKeywords": ["keyword1", "keyword2", "keyword3", ...]
}

Make the script:
- Engaging and conversational
- Include practical examples and code snippets if relevant
- Have clear sections with timestamps
- Include call-to-action points
- Be optimized for YouTube algorithm
- Address common viewer questions based on the comments context

Return ONLY valid JSON, no markdown or extra text.`

  try {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is not set")
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Google API error:", errorData)
      throw new Error(`Google API error: ${response.status}`)
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
      throw new Error("No content in API response")
    }

    // Parse JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from response")
    }

    const script = JSON.parse(jsonMatch[0]) as VideoScript
    return script
  } catch (error) {
    console.error("[v0] Script generation error:", error)
    throw new Error("Failed to generate video script")
  }
}
