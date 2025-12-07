"use client"

import type React from "react"

import { useState, useMemo } from "react"
import useSWRMutation from "swr/mutation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SentimentCharts } from "@/components/sentiment-charts"
import { CommentsTable } from "@/components/comments-table"
import { SuggestionSelector } from "@/components/suggestion-selector"
import { Sparkles, Download } from "lucide-react"

type SentimentLabel = "positive" | "negative" | "neutral"

export interface AnalyzedComment {
  text: string
  author: string
  publishedAt: string
  sentiment: SentimentLabel
  score: number
}

export interface AnalyzeResponse {
  comments: AnalyzedComment[]
  counts: { positive: number; neutral: number; negative: number }
  suggestions: string[]
}

async function analyzeFetcher(
  url: string,
  { arg }: { arg: { url: string; maxComments: number; includeReplies: boolean } },
) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || "Failed to analyze")
  }
  return (await res.json()) as AnalyzeResponse
}

function toCSV(rows: AnalyzedComment[]) {
  const header = ["author", "publishedAt", "sentiment", "score", "text"]
  const escapeCell = (v: string | number) => {
    const s = String(v ?? "")
    const needsQuote = /[",\n]/.test(s)
    const escaped = s.replace(/"/g, '""')
    return needsQuote ? `"${escaped}"` : escaped
  }
  const body = rows.map((r) => [r.author, r.publishedAt, r.sentiment, r.score, r.text].map(escapeCell).join(","))
  return [header.join(","), ...body].join("\n")
}

export default function Page() {
  const [url, setUrl] = useState("")
  const [maxComments, setMaxComments] = useState<number>(100)
  const [includeReplies, setIncludeReplies] = useState<boolean>(false)

  const { trigger, data, error, isMutating } = useSWRMutation("/api/analyze", analyzeFetcher)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    await trigger({ url, maxComments, includeReplies })
  }

  const distribution = useMemo(() => {
    if (!data) return null
    const { counts } = data
    const total = counts.positive + counts.neutral + counts.negative
    return { ...counts, total }
  }, [data])

  const commentSummary = useMemo(() => {
    if (!data) return ""
    const { comments, counts } = data
    const sentimentBreakdown = `Positive: ${counts.positive}, Neutral: ${counts.neutral}, Negative: ${counts.negative}`
    const topComments = comments
      .slice(0, 3)
      .map((c) => c.text)
      .join(" | ")
    return `${sentimentBreakdown}. Top comments: ${topComments}`
  }, [data])

  const onExportCSV = () => {
    if (!data) return
    const csv = toCSV(data.comments)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const urlObj = URL.createObjectURL(blob)
    link.href = urlObj
    link.setAttribute("download", "youtube-comments-sentiment.csv")
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(urlObj)
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-12">
      <header className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-balance mb-3">YouTube Sentiment Analyzer</h1>
        <p className="text-muted-foreground text-lg text-balance max-w-2xl mx-auto">
          Discover what your audience thinks and get AI-powered content suggestions based on real comments
        </p>
      </header>

      <Card className="mb-10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Analyze Video Comments</CardTitle>
          <CardDescription>Enter a YouTube video URL to analyze sentiment and discover trending topics</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyze} className="grid gap-6">
            <div>
              <Label htmlFor="yturl" className="text-base">
                YouTube URL
              </Label>
              <Input
                id="yturl"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="mt-2 h-11"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="count" className="text-base">
                  Number of comments
                </Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={1000}
                  step={1}
                  value={maxComments}
                  onChange={(e) => setMaxComments(Number.parseInt(e.target.value || "0", 10))}
                  className="mt-2 h-11"
                />
              </div>

              <div className="flex items-end gap-3 pb-1">
                <Switch id="replies" checked={includeReplies} onCheckedChange={setIncludeReplies} />
                <Label htmlFor="replies" className="text-base cursor-pointer">
                  Include comment replies
                </Label>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isMutating} size="lg" className="min-w-32">
                {isMutating ? "Analyzing..." : "Analyze"}
              </Button>

              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error.message}
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {data ? (
        <section className="grid gap-8">
          {distribution ? (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{distribution.total}</div>
                  <p className="text-sm text-muted-foreground">Total Comments</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{distribution.positive}</div>
                  <p className="text-sm text-muted-foreground">Positive</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">{distribution.neutral}</div>
                  <p className="text-sm text-muted-foreground">Neutral</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{distribution.negative}</div>
                  <p className="text-sm text-muted-foreground">Negative</p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Sentiment Distribution</CardTitle>
                <CardDescription>Visual breakdown of comment sentiment</CardDescription>
              </CardHeader>
              <CardContent>
                <SentimentCharts counts={data.counts} />
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Content Ideas
                </CardTitle>
                <CardDescription>Video suggestions based on comment analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {data.suggestions.length ? (
                  <ul className="space-y-3">
                    {data.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No strong topic trends detected in comments.</p>
                )}
                <div className="mt-6">
                  <Button variant="outline" onClick={onExportCSV} className="w-full bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {data.suggestions.length > 0 && (
            <SuggestionSelector suggestions={data.suggestions} commentSummary={commentSummary} />
          )}

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">All Comments</CardTitle>
              <CardDescription>Detailed sentiment analysis for each comment</CardDescription>
            </CardHeader>
            <CardContent>
              <CommentsTable rows={data.comments} />
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  )
}
