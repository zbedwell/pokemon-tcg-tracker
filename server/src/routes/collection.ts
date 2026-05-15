import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { getCardById } from "../services/pokemonTcgApi";

const router = Router();

const itemSchema = z.object({
  cardId: z.string(),
  quantity: z.number().int().min(1),
  condition: z.enum(["NM", "LP", "MP", "HP", "DMG"]),
  foil: z.boolean().optional().default(false),
  purchasePrice: z.number().positive().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
});

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const items = await prisma.collectionItem.findMany({
    where: { userId: req.userId! },
    include: { card: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { cardId, quantity, condition, foil, purchasePrice, purchaseDate, notes } = parsed.data;

  // ensure card is cached
  const card = await getCardById(cardId);
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const existing = await prisma.collectionItem.findUnique({
    where: { userId_cardId_condition_foil: { userId: req.userId!, cardId, condition, foil } },
  });

  if (existing) {
    const updated = await prisma.collectionItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
      include: { card: true },
    });
    res.json(updated);
    return;
  }

  const item = await prisma.collectionItem.create({
    data: {
      userId: req.userId!,
      cardId,
      quantity,
      condition,
      foil,
      purchasePrice: purchasePrice ?? null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      notes,
    },
    include: { card: true },
  });
  res.status(201).json(item);
});

router.put("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const item = await prisma.collectionItem.findFirst({
    where: { id: req.params.id as string, userId: req.userId! },
  });
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  const schema = itemSchema.partial().omit({ cardId: true });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const updated = await prisma.collectionItem.update({
    where: { id: item.id },
    data: {
      ...parsed.data,
      purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : undefined,
    },
    include: { card: true },
  });
  res.json(updated);
});

router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const item = await prisma.collectionItem.findFirst({
    where: { id: req.params.id as string, userId: req.userId! },
  });
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  await prisma.collectionItem.delete({ where: { id: item.id } });
  res.status(204).send();
});

export default router;
