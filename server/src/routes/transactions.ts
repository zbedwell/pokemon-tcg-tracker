import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { getCardById } from "../services/pokemonTcgApi";

const router = Router();

const txSchema = z.object({
  cardId: z.string(),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().int().min(1),
  price: z.number().positive(),
  condition: z.enum(["NM", "LP", "MP", "HP", "DMG"]),
  foil: z.boolean().optional().default(false),
  platform: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
});

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId! },
    include: { card: true },
    orderBy: { date: "desc" },
  });
  res.json(transactions);
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const parsed = txSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const card = await getCardById(data.cardId);
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }
  const tx = await prisma.transaction.create({
    data: {
      userId: req.userId!,
      cardId: data.cardId,
      type: data.type,
      quantity: data.quantity,
      price: data.price,
      condition: data.condition,
      foil: data.foil,
      platform: data.platform ?? null,
      date: new Date(data.date),
      notes: data.notes ?? null,
    },
    include: { card: true },
  });
  res.status(201).json(tx);
});

router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const tx = await prisma.transaction.findFirst({
    where: { id: req.params.id as string, userId: req.userId! },
  });
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  await prisma.transaction.delete({ where: { id: tx.id } });
  res.status(204).send();
});

export default router;
