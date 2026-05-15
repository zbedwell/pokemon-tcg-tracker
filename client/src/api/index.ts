import api from "./client";
import type {
  User,
  CollectionItem,
  Transaction,
  AnalyticsSummary,
  PortfolioData,
  Card,
  Condition,
} from "../types";

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post<{ user: User; token: string }>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>("/auth/login", data),
};

// Cards
export const cardsApi = {
  search: (q: string, page = 1, pageSize = 20) =>
    api.get<{ data: Card[]; totalCount: number }>("/cards/search", {
      params: { q, page, pageSize },
    }),
  getById: (id: string) => api.get<Card>(`/cards/${id}`),
};

// Collection
export const collectionApi = {
  list: () => api.get<CollectionItem[]>("/collection"),
  add: (data: {
    cardId: string;
    quantity: number;
    condition: Condition;
    foil?: boolean;
    purchasePrice?: number;
    purchaseDate?: string;
    notes?: string;
  }) => api.post<CollectionItem>("/collection", data),
  update: (
    id: string,
    data: {
      quantity?: number;
      condition?: Condition;
      foil?: boolean;
      purchasePrice?: number;
      purchaseDate?: string;
      notes?: string;
    }
  ) => api.put<CollectionItem>(`/collection/${id}`, data),
  remove: (id: string) => api.delete(`/collection/${id}`),
};

// Transactions
export const transactionsApi = {
  list: () => api.get<Transaction[]>("/transactions"),
  add: (data: {
    cardId: string;
    type: "BUY" | "SELL";
    quantity: number;
    price: number;
    condition: Condition;
    foil?: boolean;
    platform?: string;
    date: string;
    notes?: string;
  }) => api.post<Transaction>("/transactions", data),
  remove: (id: string) => api.delete(`/transactions/${id}`),
};

// Analytics
export const analyticsApi = {
  summary: () => api.get<AnalyticsSummary>("/analytics/summary"),
  portfolio: () => api.get<PortfolioData>("/analytics/portfolio"),
};
