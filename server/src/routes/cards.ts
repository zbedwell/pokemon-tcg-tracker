import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { searchCards, getCardById } from "../services/pokemonTcgApi";

const router = Router();

router.get("/search", authenticate, async (req: AuthRequest, res: Response) => {
  const query = req.query.q as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 50);
  if (!query?.trim()) {
    res.status(400).json({ error: "Query is required" });
    return;
  }
  try {
    const result = await searchCards(query.trim(), page, pageSize);
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: "Failed to fetch from Pokemon TCG API" });
  }
});

router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const card = await getCardById(req.params.id as string);
    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    res.json(card);
  } catch {
    res.status(502).json({ error: "Failed to fetch card" });
  }
});

export default router;
