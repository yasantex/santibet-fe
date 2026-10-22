export interface ContentPageSummary {
  slug: string
  title: string
  updatedAt: string
}

export interface ContentPageListResponse {
  data: ContentPageSummary[]
}

export interface ContentPage extends ContentPageSummary {
  /** Markdown. Render with raw HTML off. */
  body: string
}

export interface FaqItem {
  id: string
  question: string
  /** Plain text. Keep line breaks; don't parse Markdown or HTML. */
  answer: string
}

export interface FaqListResponse {
  data: FaqItem[]
}
