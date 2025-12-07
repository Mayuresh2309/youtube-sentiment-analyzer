"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"

export function SentimentCharts({ counts }: { counts: { positive: number; neutral: number; negative: number } }) {
  const pieData = [
    { name: "Positive", value: counts.positive },
    { name: "Neutral", value: counts.neutral },
    { name: "Negative", value: counts.negative },
  ]

  const barData = [
    { sentiment: "Positive", count: counts.positive },
    { sentiment: "Neutral", count: counts.neutral },
    { sentiment: "Negative", count: counts.negative },
  ]

  const COLORS = {
    Positive: "#22c55e", // green-500
    Neutral: "#eab308", // yellow-500
    Negative: "#ef4444", // red-500
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                  stroke={COLORS[entry.name as keyof typeof COLORS]}
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend
              payload={[
                { id: "pos", value: "Positive", color: COLORS.Positive, type: "square" },
                { id: "neu", value: "Neutral", color: COLORS.Neutral, type: "square" },
                { id: "neg", value: "Negative", color: COLORS.Negative, type: "square" },
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="sentiment" />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Legend
              payload={[
                { id: "pos-b", value: "Positive", color: COLORS.Positive, type: "rect" },
                { id: "neu-b", value: "Neutral", color: COLORS.Neutral, type: "rect" },
                { id: "neg-b", value: "Negative", color: COLORS.Negative, type: "rect" },
              ]}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {barData.map((entry) => (
                <Cell
                  key={entry.sentiment}
                  fill={COLORS[entry.sentiment as keyof typeof COLORS]}
                  stroke={COLORS[entry.sentiment as keyof typeof COLORS]}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
