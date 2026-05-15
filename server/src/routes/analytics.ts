import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { Decimal } from "@prisma/client/runtime/library";

const router = Router();

function toNum(d: Decimal | null | undefined): number {
  return d ? parseFloat(d.toString()) : 0;
}

router.get("/summary", authenticate, async (req: AuthRequest, res: Response) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId! },
    include: { card: true },
  });

  const buys = transactions.filter((t) => t.type === "BUY");
  const sells = transactions.filter((t) => t.type === "SELL");

  const totalInvested = buys.reduce(
    (sum, t) => sum + toNum(t.price) * t.quantity,
    0
  );
  const totalRevenue = sells.reduce(
    (sum, t) => sum + toNum(t.price) * t.quantity,
    0
  );
  const totalProfit = totalRevenue - totalInvested;
  const roi = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // per-card breakdown
  const cardMap = new Map<
    string,
    { name: string; cardId: string; invested: number; revenue: number; buySold: number }
  >();
  for (const t of transactions) {
    if (!cardMap.has(t.cardId)) {
      cardMap.set(t.cardId, {
        cardId: t.cardId,
        name: t.card.name,
        invested: 0,
        revenue: 0,
        buySold: 0,
      });
    }
    const entry = cardMap.get(t.cardId)!;
    if (t.type === "BUY") entry.invested += toNum(t.price) * t.quantity;
    if (t.type === "SELL") {
      entry.revenue += toNum(t.price) * t.quantity;
      entry.buySold += t.quantity;
    }
  }

  const cardBreakdown = Array.from(cardMap.values()).map((c) => ({
    ...c,
    profit: c.revenue - c.invested,
    roi: c.invested > 0 ? ((c.revenue - c.invested) / c.invested) * 100 : 0,
  }));

  // monthly trend
  const monthlyMap = new Map<string, { invested: number; revenue: number }>();
  for (const t of transactions) {
    const key = t.date.toISOString().slice(0, 7);
    if (!monthlyMap.has(key)) monthlyMap.set(key, { invested: 0, revenue: 0 });
    const entry = monthlyMap.get(key)!;
    if (t.type === "BUY") entry.invested += toNum(t.price) * t.quantity;
    if (t.type === "SELL") entry.revenue += toNum(t.price) * t.quantity;
  }
  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      invested: data.invested,
      revenue: data.revenue,
      profit: data.revenue - data.invested,
    }));

  res.json({
    totalInvested,
    totalRevenue,
    totalProfit,
    roi,
    totalTransactions: transactions.length,
    cardBreakdown: cardBreakdown.sort((a, b) => b.profit - a.profit),
    monthlyTrend,
  });
});

router.get("/portfolio", authenticate, async (req: AuthRequest, res: Response) => {
  const items = await prisma.collectionItem.findMany({
    where: { userId: req.userId! },
    include: { card: true },
  });

  let totalMarketValue = 0;
  let totalCostBasis = 0;

  const enriched = items.map((item) => {
    const prices = JSON.parse(item.card.pricesJson ?? "{}");
    const priceKey = item.foil ? "holofoil" : "normal";

    // TCGPlayer first, then Cardmarket trendPrice as fallback
    const tcgPrice = prices[priceKey]?.market ?? prices["holofoil"]?.market ?? prices["normal"]?.market ?? null;
    const cmPrice = prices["cardmarket"]?.trendPrice ?? prices["cardmarket"]?.averageSellPrice ?? prices["cardmarket"]?.avg30 ?? null;
    const marketPrice: number | null = tcgPrice ?? cmPrice;
    const priceSource: string | null = tcgPrice ? "tcgplayer" : cmPrice ? "cardmarket" : null;

    const itemMarketValue = marketPrice != null ? marketPrice * item.quantity : null;
    const costBasis = toNum(item.purchasePrice) ? toNum(item.purchasePrice) * item.quantity : null;

    if (itemMarketValue != null) totalMarketValue += itemMarketValue;
    if (costBasis != null) totalCostBasis += costBasis;

    return {
      ...item,
      marketPrice,
      priceSource,
      marketValue: itemMarketValue,
      costBasis,
      unrealizedGain: itemMarketValue != null && costBasis != null ? itemMarketValue - costBasis : null,
    };
  });

  res.json({
    items: enriched,
    totalMarketValue,
    totalCostBasis,
    totalUnrealizedGain: totalCostBasis > 0 ? totalMarketValue - totalCostBasis : null,
  });
});

export default router;
