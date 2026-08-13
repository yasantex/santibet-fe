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

// 
export interface Outcome {
  id: string;
  label: string;
  price: number;
}

export interface Markets {
  id: string;
  provider: string;
  eventId: string;
  title: string;
  subtitle: string;
  status: string;
  outcomes: Outcome[];
  volume: number;
  liquidity: number;
  openTime: string;
  closeTime: string;
  resolvedOutcomeId: string;
}

export interface MarketResponse {
  data: Markets[];
  cursor: string;
}