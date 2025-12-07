"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScriptGenerator } from "@/components/script-generator"
import { Sparkles, ChevronRight } from "lucide-react"

interface SuggestionSelectorProps {
  suggestions: string[]
  commentSummary: string
}

export function SuggestionSelector({ suggestions, commentSummary }: SuggestionSelectorProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)

  if (selectedSuggestion) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedSuggestion(null)} className="mb-4">
          ← Back to Suggestions
        </Button>
        <ScriptGenerator topicIdea={selectedSuggestion} commentSummary={commentSummary} />
      </div>
    )
  }

  return (
    <Card className="shadow-lg border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Generate Video Scripts
        </CardTitle>
        <CardDescription>Choose any content idea to generate a detailed, production-ready script</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
              onClick={() => setSelectedSuggestion(suggestion)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <p className="font-semibold text-lg leading-relaxed">{suggestion}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSuggestion(suggestion)
                    }}
                  >
                    Generate
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
