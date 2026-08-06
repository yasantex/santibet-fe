export interface Market {
  id: string
  question: string
  category: string
  yesPercent: number
  noPercent: number
  volume: string
}

export interface FeaturedMarket extends Market {
  changePercent: number
  chartData: { value: number }[]
}

export interface HotTopic {
  id: string
  question: string
  percent: number
}

export type DashboardData = {
  featured: FeaturedMarket
  hotTopics: HotTopic[]
  markets: Market[]
}