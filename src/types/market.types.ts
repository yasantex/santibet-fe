export interface Market {
  id: string
  question: string
  category: string
  yesPercent: number
  noPercent: number
  volume: string
}
//
export interface MarketCardVM {
  id: string
  question: string
  outcomes: OutcomeVM[]
  yesPercent: number
  noPercent: number
  volume: string
  openTime?: string
  closeTime?: string
}

export interface OutcomeVM {
  id: string
  label: string
  percent: number
}

export interface MarketOutcome {
  id: string
  label: string
  price: number
}
export interface RawMarket {
  id: string
  provider: string
  eventId: string
  title: string
  subtitle: string
  status: 'open' | 'closed' | string
  outcomes: MarketOutcome[]
  volume: number
  liquidity: number
  openTime: string
  closeTime: string
}
export interface MarketResponse {
  data: RawMarket[]
}

//
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
