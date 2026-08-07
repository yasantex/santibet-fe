export type PositionSide = 'yes' | 'no'
export type PositionStatus = 'open' | 'settled'

export interface Position {
  id: string
  status: PositionStatus
  question: string
  side: PositionSide
  yesPercent: number
  noPercent: number
  staked: number
  value: number
}

export interface PortfolioStats {
  portfolioValue: number
  totalPnl: number
  openPositionsCount: number
}

export interface PortfolioData {
  stats: PortfolioStats
  positions: Position[]
}