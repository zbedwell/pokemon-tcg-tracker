export interface User {
  id: string;
  email: string;
  username: string;
}

export interface TcgPrices {
  normal?: { low: number; mid: number; market: number; high: number };
  holofoil?: { low: number; mid: number; market: number; high: number };
  reverseHolofoil?: { low: number; mid: number; market: number; high: number };
}

export interface Card {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  images: { small: string; large: string };
  set: { id: string; name: string };
  tcgplayer?: { prices?: TcgPrices };
}

export type Condition = "NM" | "LP" | "MP" | "HP" | "DMG";

export interface CollectionItem {
  id: string;
  cardId: string;
  quantity: number;
  condition: Condition;
  foil: boolean;
  purchasePrice: string | null;
  purchaseDate: string | null;
  notes: string | null;
  createdAt: string;
  card: {
    id: string;
    name: string;
    setName: string;
    number: string;
    rarity: string | null;
    imageSmall: string | null;
    imageLarge: string | null;
    pricesJson: string;
  };
}

export interface Transaction {
  id: string;
  cardId: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: string;
  condition: Condition;
  foil: boolean;
  platform: string | null;
  date: string;
  notes: string | null;
  createdAt: string;
  card: {
    id: string;
    name: string;
    setName: string;
    number: string;
    imageSmall: string | null;
  };
}

export interface AnalyticsSummary {
  totalInvested: number;
  totalRevenue: number;
  totalProfit: number;
  roi: number;
  totalTransactions: number;
  cardBreakdown: {
    cardId: string;
    name: string;
    invested: number;
    revenue: number;
    profit: number;
    roi: number;
  }[];
  monthlyTrend: {
    month: string;
    invested: number;
    revenue: number;
    profit: number;
  }[];
}

export interface PortfolioData {
  items: (CollectionItem & {
    marketPrice: number | null;
    priceSource: "tcgplayer" | "cardmarket" | null;
    marketValue: number | null;
    costBasis: number | null;
    unrealizedGain: number | null;
  })[];
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedGain: number | null;
}
