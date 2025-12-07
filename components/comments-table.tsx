"use client"

import type { AnalyzedComment } from "@/app/page"

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const sentimentColor: Record<AnalyzedComment["sentiment"], string> = {
  positive: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  neutral: "bg-muted text-foreground",
  negative: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
}

export function CommentsTable({ rows }: { rows: AnalyzedComment[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-3 pr-4">Author</th>
            <th className="py-3 pr-4">Date</th>
            <th className="py-3 pr-4">Sentiment</th>
            <th className="py-3 pr-4">Score</th>
            <th className="py-3">Comment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b align-top">
              <td className="py-3 pr-4">{r.author}</td>
              <td className="py-3 pr-4 whitespace-nowrap">{formatDate(r.publishedAt)}</td>
              <td className="py-3 pr-4">
                <span className={`inline-flex items-center rounded px-2 py-1 text-xs ${sentimentColor[r.sentiment]}`}>
                  {r.sentiment}
                </span>
              </td>
              <td className="py-3 pr-4">{r.score}</td>
              <td className="py-3">{r.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
