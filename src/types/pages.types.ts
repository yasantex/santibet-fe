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
