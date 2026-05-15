import fetch from "node-fetch";
import { prisma } from "../lib/prisma";

const BASE_URL = "https://api.pokemontcg.io/v2";
const CACHE_TTL_HOURS = 6;

function headers() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.POKEMON_TCG_API_KEY) {
    h["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
  }
  return h;
}

export interface TcgPrices {
  normal?: { low: number; mid: number; market: number; high: number };
  holofoil?: { low: number; mid: number; market: number; high: number };
  reverseHolofoil?: { low: number; mid: number; market: number; high: number };
  "1stEditionHolofoil"?: { low: number; mid: number; market: number; high: number };
}

export interface CardmarketPrices {
  averageSellPrice?: number;
  trendPrice?: number;
  avg30?: number;
  lowPrice?: number;
  reverseHoloTrend?: number;
  reverseHoloAvg30?: number;
}

export interface ApiCard {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  images: { small: string; large: string };
  set: { id: string; name: string };
  tcgplayer?: { prices?: TcgPrices };
  cardmarket?: { prices?: CardmarketPrices };
}

function staleCheck(updatedAt: Date): boolean {
  const diffH = (Date.now() - updatedAt.getTime()) / 3_600_000;
  return diffH > CACHE_TTL_HOURS;
}

export async function searchCards(
  query: string,
  page = 1,
  pageSize = 20
): Promise<{ data: ApiCard[]; totalCount: number }> {
  const q = encodeURIComponent(`name:"${query}*"`);
  const url = `${BASE_URL}/cards?q=${q}&page=${page}&pageSize=${pageSize}&orderBy=-set.releaseDate`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`Pokemon TCG API error: ${res.status}`);
  const json = (await res.json()) as { data: ApiCard[]; totalCount: number };
  await cacheCards(json.data);
  return json;
}

export async function getCardById(id: string): Promise<ApiCard | null> {
  const cached = await prisma.cachedCard.findUnique({ where: { id } });
  if (cached && !staleCheck(cached.updatedAt)) {
    return {
      id: cached.id,
      name: cached.name,
      number: cached.number,
      rarity: cached.rarity ?? undefined,
      images: { small: cached.imageSmall ?? "", large: cached.imageLarge ?? "" },
      set: { id: cached.setId, name: cached.setName },
      tcgplayer: { prices: JSON.parse(cached.pricesJson) },
    };
  }
  const res = await fetch(`${BASE_URL}/cards/${id}`, { headers: headers() });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: ApiCard };
  await cacheCards([json.data]);
  return json.data;
}

async function cacheCards(cards: ApiCard[]) {
  for (const card of cards) {
    await prisma.cachedCard.upsert({
      where: { id: card.id },
      create: {
        id: card.id,
        name: card.name,
        setId: card.set.id,
        setName: card.set.name,
        number: card.number,
        rarity: card.rarity,
        imageSmall: card.images.small,
        imageLarge: card.images.large,
        pricesJson: JSON.stringify({ ...(card.tcgplayer?.prices ?? {}), cardmarket: card.cardmarket?.prices ?? null }),
      },
      update: {
        name: card.name,
        setId: card.set.id,
        setName: card.set.name,
        number: card.number,
        rarity: card.rarity,
        imageSmall: card.images.small,
        imageLarge: card.images.large,
        pricesJson: JSON.stringify({ ...(card.tcgplayer?.prices ?? {}), cardmarket: card.cardmarket?.prices ?? null }),
      },
    });
  }
}
