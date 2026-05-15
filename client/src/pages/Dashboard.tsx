import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api";
import { useAuthStore } from "../store/authStore";
import { Card } from "../components/ui/Card";
import { Layout } from "../components/Layout";
import { TrendingUp, TrendingDown, DollarSign, Activity, Archive } from "lucide-react";
import { Link } from "react-router-dom";

function StatCard({
  label,
  value,
  sub,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  icon: React.ElementType;
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className="p-2 bg-yellow-400/10 rounded-lg">
        <Icon className="w-5 h-5 text-yellow-400" />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {sub && (
          <p
            className={`text-xs mt-1 ${
              positive === undefined
                ? "text-gray-500"
                : positive
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {sub}
          </p>
        )}
      </div>
    </Card>
  );
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => analyticsApi.summary().then((r) => r.data),
  });
  const { data: portfolio } = useQuery({
    queryKey: ["analytics-portfolio"],
    queryFn: () => analyticsApi.portfolio().then((r) => r.data),
  });

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.username}
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Here's an overview of your Pokemon TCG portfolio.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Portfolio Value"
          value={fmt(portfolio?.totalMarketValue ?? 0)}
          icon={DollarSign}
        />
        <StatCard
          label="Total Invested"
          value={fmt(summary?.totalInvested ?? 0)}
          icon={Archive}
        />
        <StatCard
          label="Realized Profit"
          value={fmt(summary?.totalProfit ?? 0)}
          sub={summary ? `${summary.roi.toFixed(1)}% ROI` : undefined}
          positive={summary ? summary.totalProfit >= 0 : undefined}
          icon={summary?.totalProfit >= 0 ? TrendingUp : TrendingDown}
        />
        <StatCard
          label="Transactions"
          value={String(summary?.totalTransactions ?? 0)}
          icon={Activity}
        />
      </div>

      {/* Top movers */}
      {summary && summary.cardBreakdown.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-4">Top Performing Cards</h2>
          <div className="flex flex-col divide-y divide-gray-800">
            {summary.cardBreakdown.slice(0, 5).map((c) => (
              <div key={c.cardId} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-300">{c.name}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">{fmt(c.invested)} in</span>
                  <span
                    className={c.profit >= 0 ? "text-green-400" : "text-red-400"}
                  >
                    {c.profit >= 0 ? "+" : ""}
                    {fmt(c.profit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!summary?.totalTransactions && (
        <Card className="text-center py-12">
          <p className="text-gray-400 mb-4">No transactions yet.</p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/collection"
              className="text-sm text-yellow-400 hover:underline"
            >
              Add to collection →
            </Link>
            <Link
              to="/analytics"
              className="text-sm text-yellow-400 hover:underline"
            >
              Log a transaction →
            </Link>
          </div>
        </Card>
      )}
    </Layout>
  );
}
