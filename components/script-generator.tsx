"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Copy, Download } from "lucide-react"
import type { VideoScript } from "@/lib/script-generator"

interface ScriptGeneratorProps {
  topicIdea: string
  commentSummary: string
}

export function ScriptGenerator({ topicIdea, commentSummary }: ScriptGeneratorProps) {
  const [script, setScript] = useState<VideoScript | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateScript = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicIdea: topicIdea,
          commentContext: commentSummary,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate script")
      }

      const data = (await response.json()) as VideoScript
      setScript(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadScript = () => {
    if (!script) return

    const content = `
VIDEO TITLE: ${script.title}

DESCRIPTION:
${script.description}

DURATION: ${script.duration}

SEO KEYWORDS: ${script.seoKeywords.join(", ")}

TALKING POINTS:
${script.talkingPoints.map((point, i) => `${i + 1}. ${point}`).join("\n")}

SCRIPT SECTIONS:
${script.sections
  .map(
    (section) => `
--- ${section.title} (${section.duration}) ---
${section.content}

Tips:
${section.tips.map((tip) => `• ${tip}`).join("\n")}
`,
  )
  .join("\n")}

THUMBNAIL IDEAS:
${script.thumbnailIdeas.map((idea, i) => `${i + 1}. ${idea}`).join("\n")}
    `.trim()

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${script.title.replace(/\s+/g, "-")}-script.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!script) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Generate Video Script</CardTitle>
          <CardDescription>Create a detailed script for your selected suggestion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-semibold text-blue-900 dark:text-blue-100">Selected Topic:</p>
            <p className="text-blue-800 dark:text-blue-200 mt-2">{topicIdea}</p>
          </div>

          <Button onClick={handleGenerateScript} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Script...
              </>
            ) : (
              "Generate Detailed Script"
            )}
          </Button>

          {error && (
            <div className="bg-red-50 dark:bg-red-950 p-3 rounded text-red-700 dark:text-red-200 text-sm">{error}</div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{script.title}</CardTitle>
              <CardDescription className="mt-2">Duration: {script.duration}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(script.title)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={downloadScript}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{script.description}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">SEO Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {script.seoKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Talking Points</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {script.talkingPoints.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-semibold text-green-600 dark:text-green-400">{i + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-bold">Script Sections</h2>
        {script.sections.map((section, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-lg">
                {section.title} ({section.duration})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Script</h4>
                <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{section.content}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Tips</h4>
                <ul className="space-y-1">
                  {section.tips.map((tip, j) => (
                    <li key={j} className="text-sm flex gap-2">
                      <span className="text-yellow-600 dark:text-yellow-400">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thumbnail Ideas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {script.thumbnailIdeas.map((idea, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-semibold text-red-600 dark:text-red-400">{i + 1}.</span>
                <span>{idea}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button onClick={() => setScript(null)} variant="outline" className="w-full">
        Generate Another Script
      </Button>
    </div>
  )
}
