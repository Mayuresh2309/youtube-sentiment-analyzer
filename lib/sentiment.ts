import Sentiment from "sentiment"

export type SentimentLabel = "positive" | "negative" | "neutral"

const analyzer = new Sentiment()

export function analyzeSentiment(text: string): { label: SentimentLabel; score: number } {
  const result = analyzer.analyze(text || "")
  const score = result.score || 0
  const label: SentimentLabel = score > 0 ? "positive" : score < 0 ? "negative" : "neutral"
  return { label, score }
}

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "if",
  "then",
  "this",
  "that",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "as",
  "by",
  "at",
  "it",
  "is",
  "are",
  "be",
  "was",
  "were",
  "from",
  "you",
  "i",
  "we",
  "they",
  "he",
  "she",
  "them",
  "your",
  "our",
  "my",
  "me",
  "us",
  "so",
  "not",
  "just",
  "can",
  "could",
  "should",
  "would",
  "what",
  "when",
  "how",
  "why",
  "which",
  "who",
  "will",
  "about",
  "up",
  "down",
  "out",
  "over",
  "under",
  "into",
  "more",
  "most",
  "less",
  "least",
  "very",
  "much",
  "make",
  "like",
  "get",
  "got",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "please",
  "plz",
  "pls",
  "project",
  "projects",
  "app",
  "apps",
  "website",
  "code",
  "video",
  "tutorial",
  "real",
])

export function extractTopics(texts: string[]): {
  technologies: Map<string, number>
  actions: Map<string, number>
  phrases: Map<string, number>
  questions: string[]
} {
  const technologies = new Map<string, number>()
  const actions = new Map<string, number>()
  const phrases = new Map<string, number>()
  const questions: string[] = []

  // Common tech/tool patterns
  const techPatterns =
    /\b(github|supabase|api|database|clone|animation|css|html|javascript|react|next|node|python|java|typescript|docker|kubernetes|aws|azure|firebase|mongodb|sql|redux|vue|angular|tailwind|bootstrap|figma|design|ui|ux|backend|frontend|fullstack|auth|authentication|deployment|hosting|vercel|netlify|cravix|openai|stripe|redis|neon|prisma)\b/gi

  // Action patterns (what people want)
  const actionPatterns =
    /\b(create|make|build|add|implement|integrate|connect|generate|improve|fix|explain|show|teach|tutorial|guide|learn|understand)\b/gi

  for (const text of texts) {
    const lower = text.toLowerCase()

    // Extract questions
    if (
      lower.includes("?") ||
      lower.startsWith("how") ||
      lower.startsWith("can you") ||
      lower.startsWith("could you")
    ) {
      questions.push(text)
    }

    // Extract technologies
    const techMatches = text.matchAll(techPatterns)
    for (const match of techMatches) {
      const tech = match[0].toLowerCase()
      technologies.set(tech, (technologies.get(tech) || 0) + 1)
    }

    // Extract actions
    const actionMatches = text.matchAll(actionPatterns)
    for (const match of actionMatches) {
      const action = match[0].toLowerCase()
      actions.set(action, (actions.get(action) || 0) + 1)
    }

    // Extract meaningful phrases (2-4 words)
    const tokens = (lower.match(/[a-z0-9']+/g) || []).filter((t) => !STOPWORDS.has(t) && t.length > 2)
    for (let i = 0; i < tokens.length - 1; i++) {
      // Bigrams
      const bigram = `${tokens[i]} ${tokens[i + 1]}`
      phrases.set(bigram, (phrases.get(bigram) || 0) + 1)

      // Trigrams
      if (i < tokens.length - 2) {
        const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`
        phrases.set(trigram, (phrases.get(trigram) || 0) + 1)
      }
    }
  }

  return { technologies, actions, phrases, questions }
}

export function suggestTopics(
  technologies: Map<string, number>,
  actions: Map<string, number>,
  phrases: Map<string, number>,
  questions: string[],
  count = 6,
): string[] {
  const suggestions: string[] = []

  // Sort by frequency
  const topTech = [...technologies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  const topActions = [...actions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topPhrases = [...phrases.entries()]
    .filter(([_, freq]) => freq >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  // Strategy 1: Combine top actions with top technologies
  for (let i = 0; i < Math.min(2, topActions.length) && suggestions.length < count; i++) {
    for (let j = 0; j < Math.min(2, topTech.length) && suggestions.length < count; j++) {
      const action = topActions[i][0]
      const tech = topTech[j][0]
      const title = `How to ${action} ${tech === "api" ? "an API" : tech === "app" ? "an app" : tech}`
      if (!suggestions.includes(title)) {
        suggestions.push(title)
      }
    }
  }

  // Strategy 2: Use top phrases directly as topics
  for (let i = 0; i < Math.min(3, topPhrases.length) && suggestions.length < count; i++) {
    const phrase = topPhrases[i][0]
    const words = phrase.split(" ")
    const capitalized = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    const title = `${capitalized}: Complete guide`
    if (!suggestions.some((s) => s.toLowerCase().includes(phrase))) {
      suggestions.push(title)
    }
  }

  // Strategy 3: Address common questions
  if (questions.length > 0 && suggestions.length < count) {
    const questionTopics = new Map<string, number>()
    for (const q of questions) {
      const lower = q.toLowerCase()
      for (const [tech] of topTech) {
        if (lower.includes(tech)) {
          questionTopics.set(tech, (questionTopics.get(tech) || 0) + 1)
        }
      }
    }
    const sortedQuestionTopics = [...questionTopics.entries()].sort((a, b) => b[1] - a[1])
    for (const [tech] of sortedQuestionTopics) {
      if (suggestions.length >= count) break
      const title = `Answering your questions about ${tech}`
      if (!suggestions.some((s) => s.toLowerCase().includes(tech))) {
        suggestions.push(title)
      }
    }
  }

  // Strategy 4: Integration/combination topics
  if (topTech.length >= 2 && suggestions.length < count) {
    const tech1 = topTech[0][0]
    const tech2 = topTech[1][0]
    const title = `Integrating ${tech1} with ${tech2}`
    if (!suggestions.includes(title)) {
      suggestions.push(title)
    }
  }

  // Strategy 5: Tutorial-style based on top tech
  for (let i = 0; i < topTech.length && suggestions.length < count; i++) {
    const tech = topTech[i][0]
    const templates = [
      `${tech.charAt(0).toUpperCase() + tech.slice(1)} tutorial for beginners`,
      `Advanced ${tech} techniques`,
      `${tech.charAt(0).toUpperCase() + tech.slice(1)} best practices`,
    ]
    for (const template of templates) {
      if (suggestions.length >= count) break
      if (!suggestions.some((s) => s.toLowerCase().includes(tech))) {
        suggestions.push(template)
        break
      }
    }
  }

  return suggestions.slice(0, count)
}

// Enhanced coverage-driven suggestion model that considers all comments (incl. neutral) and prioritizes request-intent comments
export function suggestTopicsEnhanced(comments: { text: string; sentiment: SentimentLabel }[], count = 6): string[] {
  const intentRegex =
    /\b(can you|could you|please|plz|pls|make|create|build|do|add|implement|integrate|connect|tutorial|guide|explain|video on|cover|next video|new video|project)\b/i

  const techRegex =
    /\b(github|supabase|api|database|clone|animation|css|html|javascript|react|next|node|python|java|typescript|docker|kubernetes|aws|azure|firebase|mongodb|sql|redux|vue|angular|tailwind|bootstrap|figma|design|ui|ux|backend|frontend|fullstack|auth|authentication|deployment|hosting|vercel|netlify|cravix|openai|stripe|redis|neon|prisma)\b/i

  type TopicKey = string // normalized lowercase phrase
  const coverage = new Map<TopicKey, Set<number>>()
  const topicType = new Map<TopicKey, "tech" | "phrase" | "integration">()
  const topicDisplay = new Map<TopicKey, string>() // human-readable
  const covered = new Set<number>()

  const weightBySentiment: Record<SentimentLabel, number> = { neutral: 1.0, positive: 0.9, negative: 0.75 }

  const scoreKey = (key: TopicKey) => {
    let s = 0
    const cov = coverage.get(key) || new Set<number>()
    cov.forEach((idx) => {
      if (covered.has(idx)) return
      const base = weightBySentiment[comments[idx].sentiment]
      const intentBoost =
        comments[idx].text.toLowerCase().includes("next video") ||
        comments[idx].text.toLowerCase().includes("new video")
          ? 1.6
          : 1.0
      const typeBoost = topicType.get(key) === "integration" ? 1.25 : topicType.get(key) === "tech" ? 1.1 : 1.0
      s += base * intentBoost * typeBoost
    })
    // down-rank meaningless short phrases
    if (topicType.get(key) === "phrase" && (key.length < 6 || key.split(" ").length === 1)) s *= 0.6
    return s
  }

  const tokenize = (s: string) =>
    (s.toLowerCase().match(/[a-z0-9']+/g) || []).filter((t) => !STOPWORDS.has(t) && t.length > 2)
  const titleCase = (s: string) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))

  // Build candidate topics from techs and n-grams, and track which comments they cover
  const techCounts = new Map<string, number>()
  const bigramCounts = new Map<string, number>()
  const trigramCounts = new Map<string, number>()

  comments.forEach((c, idx) => {
    const lower = c.text.toLowerCase()
    const tokens = tokenize(lower)
    const techMatches = lower.match(new RegExp(techRegex, "gi")) || []
    for (const m of techMatches) {
      const k = m.toLowerCase()
      techCounts.set(k, (techCounts.get(k) || 0) + 1)
      const key = k
      if (!coverage.has(key)) coverage.set(key, new Set())
      coverage.get(key)!.add(idx)
      topicType.set(key, "tech")
      topicDisplay.set(key, titleCase(k))
    }

    // n-grams
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`
      bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1)
      const keyB = bigram
      if (!coverage.has(keyB)) coverage.set(keyB, new Set())
      coverage.get(keyB)!.add(idx)
      topicType.set(keyB, "phrase")
      topicDisplay.set(keyB, titleCase(bigram))

      if (i < tokens.length - 2) {
        const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`
        trigramCounts.set(trigram, (trigramCounts.get(trigram) || 0) + 1)
        const keyT = trigram
        if (!coverage.has(keyT)) coverage.set(keyT, new Set())
        coverage.get(keyT)!.add(idx)
        topicType.set(keyT, "phrase")
        topicDisplay.set(keyT, titleCase(trigram))
      }
    }
  })

  // Filter to only meaningful candidates
  const techTop = [...techCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([k]) => k)
  const bigramTop = [...bigramCounts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k]) => k)
  const trigramTop = [...trigramCounts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k]) => k)

  // Integration candidates from top tech pairs that co-occur
  const integrationCandidates: string[] = []
  for (let i = 0; i < techTop.length; i++) {
    for (let j = i + 1; j < techTop.length; j++) {
      const a = techTop[i]
      const b = techTop[j]
      // coverage intersection > 0
      const covA = coverage.get(a) || new Set()
      const covB = coverage.get(b) || new Set()
      const inter = new Set<number>()
      covA.forEach((idx) => {
        if (covB.has(idx)) inter.add(idx)
      })
      if (inter.size > 0) {
        const key = `${a}|${b}`
        coverage.set(key, inter)
        topicType.set(key, "integration")
        topicDisplay.set(key, `${titleCase(a)} + ${titleCase(b)}`)
        integrationCandidates.push(key)
      }
    }
  }

  const candidates: string[] = [...new Set([...techTop, ...bigramTop, ...trigramTop, ...integrationCandidates])]

  // Greedy selection to maximize unique coverage
  const selected: string[] = []
  for (let k = 0; k < count; k++) {
    let bestKey: string | null = null
    let bestScore = 0
    for (const key of candidates) {
      if (selected.includes(key)) continue
      const sc = scoreKey(key)
      if (sc > bestScore) {
        bestScore = sc
        bestKey = key
      }
    }
    if (!bestKey || bestScore === 0) break
    selected.push(bestKey)
    ;(coverage.get(bestKey) || new Set()).forEach((idx) => covered.add(idx))
  }

  // Human-friendly titles
  const toTitle = (key: string) => {
    const t = topicType.get(key)
    const display = topicDisplay.get(key) || titleCase(key)
    if (t === "integration") {
      const [a, b] = key.split("|")
      return `Integrate ${titleCase(a)} with ${titleCase(b)} (Step-by-step)`
    }
    if (t === "tech") {
      if (/\bclone\b/.test(key)) return "Build a Modern Clone App (Full Tutorial)"
      if (/\bapi\b/.test(key)) return "How to build an API (Complete Guide)"
      return `${display} Project Tutorial (Step-by-step)`
    }
    if (/\b(auth|authentication|login|signup)\b/.test(key)) return `${display}: Secure Auth with Best Practices`
    if (/\b(animation|video)\b/.test(key)) return `${display}: Full Workflow & Tools`
    if (/\b(connect|integrate|with)\b/.test(key)) return `${display}: Integration Guide`
    return `${display}: Deep Dive`
  }

  const titles = selected.map(toTitle)

  // Fallback if we selected very few
  while (titles.length < count && techTop.length > 0) {
    const t = techTop[titles.length % techTop.length]
    const extra = `${titleCase(t)} Best Practices`
    if (!titles.some((x) => x.toLowerCase().includes(t))) titles.push(extra)
    else break
  }

  // Deduplicate and trim
  return [...new Set(titles)].slice(0, count)
}

// Intent-driven suggestion model that prioritizes comments asking for new videos/topics
export function suggestTopicsIntentDriven(
  comments: { text: string; sentiment: SentimentLabel }[],
  count = 6,
): string[] {
  // detect "request/next video" intent
  const intentRegex =
    /\b(can you|could you|please|plz|pls|make|create|build|add|implement|integrate|connect|tutorial|guide|explain|video on|cover|next video|new video|project|clone|show)\b/i

  const techRegex =
    /\b(github|supabase|api|database|clone|animation|css|html|javascript|react|next|node|python|java|typescript|docker|kubernetes|aws|azure|firebase|mongodb|sql|redux|vue|angular|tailwind|bootstrap|figma|design|ui|ux|backend|frontend|fullstack|auth|authentication|deployment|hosting|vercel|netlify|cravix|openai|stripe|redis|neon|prisma)\b/i

  const tokenize = (s: string) =>
    (s.toLowerCase().match(/[a-z0-9']+/g) || []).filter((t) => !STOPWORDS.has(t) && t.length > 2)
  const titleCase = (s: string) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))

  const requestIdxs: number[] = []
  comments.forEach((c, i) => {
    if (intentRegex.test((c.text || "").toLowerCase())) requestIdxs.push(i)
  })

  // If too few explicit requests, still run but with smaller boosts
  const hasSolidIntent = requestIdxs.length >= Math.max(3, Math.ceil(comments.length * 0.12))

  type Key = string
  const coverage = new Map<Key, Set<number>>() // which comments mention the topic
  const topicType = new Map<Key, "tech" | "phrase" | "integration">()
  const display = new Map<Key, string>()
  const covered = new Set<number>()

  const addCoverage = (key: Key, idx: number, type: "tech" | "phrase" | "integration", pretty: string) => {
    if (!coverage.has(key)) coverage.set(key, new Set())
    coverage.get(key)!.add(idx)
    if (!topicType.has(key)) topicType.set(key, type)
    if (!display.has(key)) display.set(key, pretty)
  }

  // Collect candidates from request comments primarily, but also include others
  const candidateKeys = new Set<Key>()

  comments.forEach((c, idx) => {
    const text = c.text || ""
    const lower = text.toLowerCase()
    const isIntent = requestIdxs.includes(idx)
    const tokens = tokenize(lower)

    // tech mentions
    const techMatches = lower.match(new RegExp(techRegex, "gi")) || []
    for (const m of techMatches) {
      const k = m.toLowerCase()
      candidateKeys.add(k)
      addCoverage(k, idx, "tech", titleCase(k))
    }

    // n-grams (2-3)
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`
      candidateKeys.add(bigram)
      addCoverage(bigram, idx, "phrase", titleCase(bigram))
      if (i < tokens.length - 2) {
        const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`
        candidateKeys.add(trigram)
        addCoverage(trigram, idx, "phrase", titleCase(trigram))
      }
    }

    // bonus: if intent and contains "with" pattern like "github with supabase"
    if (isIntent) {
      const withMatch = lower.match(/\b([a-z0-9]+)\s+with\s+([a-z0-9]+)\b/i)
      if (withMatch) {
        const a = withMatch[1]
        const b = withMatch[2]
        const key = `${a}|${b}`
        candidateKeys.add(key)
        topicType.set(key, "integration")
        display.set(key, `${titleCase(a)} + ${titleCase(b)}`)
        addCoverage(key, idx, "integration", `${titleCase(a)} + ${titleCase(b)}`)
      }
    }
  })

  // Build explicit integration candidates for top co-occurring techs
  const techKeys = [...candidateKeys].filter((k) => topicType.get(k) === "tech")
  for (let i = 0; i < techKeys.length; i++) {
    for (let j = i + 1; j < techKeys.length; j++) {
      const a = techKeys[i]
      const b = techKeys[j]
      const covA = coverage.get(a) || new Set()
      const covB = coverage.get(b) || new Set()
      const inter = new Set<number>()
      covA.forEach((id) => {
        if (covB.has(id)) inter.add(id)
      })
      if (inter.size > 0) {
        const key = `${a}|${b}`
        candidateKeys.add(key)
        topicType.set(key, "integration")
        display.set(key, `${display.get(a) || titleCase(a)} + ${display.get(b) || titleCase(b)}`)
        coverage.set(key, inter)
      }
    }
  }

  // Score by coverage with boosts: intent comments, integration topics, and neutral weighting
  const weightBySentiment: Record<SentimentLabel, number> = { neutral: 1.0, positive: 0.9, negative: 0.75 }

  const scoreKey = (key: Key) => {
    let s = 0
    const cov = coverage.get(key) || new Set<number>()
    cov.forEach((idx) => {
      if (covered.has(idx)) return
      const base = weightBySentiment[comments[idx].sentiment]
      const intentBoost = requestIdxs.includes(idx) ? (hasSolidIntent ? 1.6 : 1.25) : 1.0
      const typeBoost = topicType.get(key) === "integration" ? 1.25 : topicType.get(key) === "tech" ? 1.1 : 1.0
      s += base * intentBoost * typeBoost
    })
    // down-rank meaningless short phrases
    if (topicType.get(key) === "phrase" && (key.length < 6 || key.split(" ").length === 1)) s *= 0.6
    return s
  }

  const intentSet = new Set(requestIdxs)
  const filteredKeys = [...candidateKeys].filter((key) => {
    const cov = coverage.get(key) || new Set<number>()
    let intentHits = 0
    cov.forEach((i) => {
      if (intentSet.has(i)) intentHits++
    })
    return (
      intentHits > 0 ||
      (cov.size >= 2 && topicType.get(key) !== "phrase") ||
      (cov.size >= 3 && topicType.get(key) === "phrase")
    )
  })

  const candidatesSorted = [...filteredKeys].sort((a, b) => scoreKey(b) - scoreKey(a))

  const selected: Key[] = []
  for (const key of candidatesSorted) {
    if (selected.length >= count) break
    const sc = scoreKey(key)
    if (sc <= 0) continue
    selected.push(key)
    ;(coverage.get(key) || new Set()).forEach((id) => covered.add(id))
  }

  const toTitle = (key: Key) => {
    const t = topicType.get(key)
    const pretty = display.get(key) || titleCase(key)
    if (t === "integration") return `Integrate ${pretty} (Step-by-step)`
    if (t === "tech") {
      if (/\bclone\b/.test(key)) return "Build a Modern Clone App (Full Tutorial)"
      if (/\bapi\b/.test(key)) return "How to Build an API (Complete Guide)"
      return `${pretty} Project Tutorial (Hands-on)`
    }
    if (/\b(auth|authentication|login|signup)\b/.test(key)) return `${pretty}: Secure Auth Best Practices`
    if (/\b(animation|video)\b/.test(key)) return `${pretty}: Full Workflow & Tools`
    if (/\b(connect|integrate|with)\b/.test(key)) return `${pretty}: Integration Guide`
    return `${pretty}: Deep Dive`
  }

  const titles = selected.map(toTitle)
  return [...new Set(titles)].slice(0, count)
}
