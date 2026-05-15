import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import cardRoutes from "./routes/cards";
import collectionRoutes from "./routes/collection";
import transactionRoutes from "./routes/transactions";
import analyticsRoutes from "./routes/analytics";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed =
        allowedOrigins.some((o) => origin === o) ||
        origin.endsWith(".vercel.app");
      callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/collection", collectionRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/analytics", analyticsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
