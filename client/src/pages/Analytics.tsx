import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyticsApi, transactionsApi, cardsApi } from "../api";
import { Layout } from "../components/Layout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Plus, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";
import type { Condition, Card as PokemonCard } from "../types";

const CONDITIONS: Condition[] = ["NM", "LP", "MP", "HP", "DMG"];

function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [form, setForm] = useState({
    type: "BUY" as "BUY" | "SELL",
    quantity: 1,
    price: "",
    condition: "NM" as Condition,
    foil: false,
    platform: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ["card-search-tx", searchQuery],
    queryFn: () =>
      searchQuery ? cardsApi.search(searchQuery).then((r) => r.data.data) : [],
    enabled: !!searchQuery,
  });

  const mutation = useMutation({
    mutationFn: () =>
      transactionsApi.add({
        cardId: selectedCard!.id,
        type: form.type,
        quantity: form.quantity,
        price: parseFloat(form.price),
        condition: form.condition,
        foil: form.foil,
        platform: form.platform || undefined,
        date: form.date,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
      toast.success("Transaction logged");
      onClose();
    },
    onError: () => toast.error("Failed to log transaction"),
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold">Log Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100">
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Card search */}
          {!selectedCard ? (
            <div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearchQuery(searchInput.trim());
                }}
                className="flex gap-2 mb-3"
              >
                <Input
                  placeholder="Search for a card..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm" loading={isFetching}>
                  <Search className="w-4 h-4" />
                </Button>
              </form>

              {searchResults && searchResults.length > 0 && (
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {searchResults.slice(0, 12).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCard(c)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-yellow-400/50 transition-all"
                    >
                      {c.images.small && (
                        <img src={c.images.small} alt={c.name} className="w-full rounded" />
                      )}
                      <p className="text-xs text-center truncate w-full">{c.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              {selectedCard.images.small && (
                <img
                  src={selectedCard.images.small}
                  alt={selectedCard.name}
                  className="w-12 rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{selectedCard.name}</p>
                <p className="text-xs text-gray-400">{selectedCard.set.name}</p>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Change
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as "BUY" | "SELL" }))
              }
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </Select>
            <Select
              label="Condition"
              value={form.condition}
              onChange={(e) =>
                setForm((f) => ({ ...f, condition: e.target.value as Condition }))
              }
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price per card ($)"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
            <Input
              label="Quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <Input
              label="Platform"
              placeholder="eBay, TCGPlayer, local..."
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              className="accent-yellow-400"
              checked={form.foil}
              onChange={(e) => setForm((f) => ({ ...f, foil: e.target.checked }))}
            />
            Foil / Holo
          </label>

          <Input
            label="Notes"
            placeholder="Optional..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!selectedCard || !form.price}
            className="flex-1"
          >
            Log Transaction
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Analytics() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => analyticsApi.summary().then((r) => r.data),
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsApi.list().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
      toast.success("Transaction deleted");
    },
  });

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track your buy/sell activity and ROI.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Log Transaction
        </Button>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Invested", value: fmt(summary.totalInvested), color: "text-gray-100" },
            { label: "Total Revenue", value: fmt(summary.totalRevenue), color: "text-gray-100" },
            {
              label: "Net Profit",
              value: `${summary.totalProfit >= 0 ? "+" : ""}${fmt(summary.totalProfit)}`,
              color: summary.totalProfit >= 0 ? "text-green-400" : "text-red-400",
            },
            {
              label: "ROI",
              value: `${summary.roi.toFixed(1)}%`,
              color: summary.roi >= 0 ? "text-green-400" : "text-red-400",
            },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Monthly trend chart */}
      {summary && summary.monthlyTrend.length > 1 && (
        <Card className="mb-6">
          <h2 className="font-semibold mb-4">Monthly P&L</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                labelStyle={{ color: "#e5e7eb" }}
                formatter={(v) => fmt(Number(v))}
              />
              <Bar dataKey="invested" name="Invested" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" name="Revenue" fill="#facc15" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Per-card breakdown */}
      {summary && summary.cardBreakdown.length > 0 && (
        <Card className="mb-6">
          <h2 className="font-semibold mb-4">Card Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {["Card", "Invested", "Revenue", "Profit", "ROI"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-gray-400 font-medium px-3 py-2"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.cardBreakdown.map((c) => (
                  <tr key={c.cardId} className="border-b border-gray-800/50">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2 text-gray-300">{fmt(c.invested)}</td>
                    <td className="px-3 py-2 text-gray-300">{fmt(c.revenue)}</td>
                    <td
                      className={`px-3 py-2 font-medium ${
                        c.profit >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {c.profit >= 0 ? "+" : ""}
                      {fmt(c.profit)}
                    </td>
                    <td
                      className={`px-3 py-2 ${
                        c.roi >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {c.roi.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Transaction log */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Transaction Log</h2>
        {transactions && transactions.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-400">No transactions yet.</p>
            <p className="text-sm text-gray-500 mt-1">
              Log a buy or sell above to start tracking ROI.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions?.map((tx) => (
              <Card key={tx.id} padding={false}>
                <div className="flex items-center gap-4 p-4">
                  {tx.card.imageSmall && (
                    <img
                      src={tx.card.imageSmall}
                      alt={tx.card.name}
                      className="w-10 rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tx.card.name}</p>
                    <p className="text-xs text-gray-400">
                      {tx.card.setName} · {tx.condition}
                      {tx.foil && " · Foil"}
                    </p>
                  </div>
                  <div className="flex items-center gap-5 text-sm shrink-0">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        tx.type === "BUY"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {tx.type}
                    </span>
                    <div className="text-right">
                      <p className="font-medium">
                        {fmt(parseFloat(tx.price))} × {tx.quantity}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fmt(parseFloat(tx.price) * tx.quantity)} total
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500 hidden sm:block">
                      <p>{new Date(tx.date).toLocaleDateString()}</p>
                      {tx.platform && <p>{tx.platform}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(tx.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} />}
    </Layout>
  );
}
