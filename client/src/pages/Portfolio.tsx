import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../api";
import { Layout } from "../components/Layout";
import { Card } from "../components/ui/Card";
import { TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";

export function Portfolio() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-portfolio"],
    queryFn: () => analyticsApi.portfolio().then((r) => r.data),
  });

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  if (isLoading) {
    return (
      <Layout>
        <p className="text-gray-400">Loading portfolio...</p>
      </Layout>
    );
  }

  if (!data) return null;

  const unrealizedGain = data.totalUnrealizedGain;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-gray-400 text-sm mt-1">
          Market values pulled from TCGPlayer via the Pokemon TCG API.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-start gap-3">
          <div className="p-2 bg-yellow-400/10 rounded-lg">
            <DollarSign className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Market Value</p>
            <p className="text-xl font-bold">{fmt(data.totalMarketValue)}</p>
          </div>
        </Card>
        <Card className="flex items-start gap-3">
          <div className="p-2 bg-blue-400/10 rounded-lg">
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Cost Basis</p>
            <p className="text-xl font-bold">{fmt(data.totalCostBasis)}</p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 col-span-2">
          <div
            className={`p-2 rounded-lg ${
              unrealizedGain == null
                ? "bg-gray-700/20"
                : unrealizedGain >= 0
                ? "bg-green-400/10"
                : "bg-red-400/10"
            }`}
          >
            {unrealizedGain == null || unrealizedGain >= 0 ? (
              <TrendingUp
                className={`w-5 h-5 ${
                  unrealizedGain == null ? "text-gray-500" : "text-green-400"
                }`}
              />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400">Unrealized Gain</p>
            <p
              className={`text-xl font-bold ${
                unrealizedGain == null
                  ? "text-gray-500"
                  : unrealizedGain >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {unrealizedGain == null
                ? "Add purchase prices"
                : `${unrealizedGain >= 0 ? "+" : ""}${fmt(unrealizedGain)}`}
            </p>
          </div>
        </Card>
      </div>

      {/* Card table */}
      {data.items.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-400">
            Your collection is empty. Add cards to see portfolio values.
          </p>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 font-medium px-5 py-3">
                    Card
                  </th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3">
                    Condition
                  </th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">
                    Qty
                  </th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">
                    Market/ea
                  </th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">
                    Market Value
                  </th>
                  <th className="text-right text-gray-400 font-medium px-4 py-3">
                    Cost Basis
                  </th>
                  <th className="text-right text-gray-400 font-medium px-5 py-3">
                    Unrealized
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items
                  .sort((a, b) => b.marketValue - a.marketValue)
                  .map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {item.card.imageSmall && (
                            <img
                              src={item.card.imageSmall}
                              alt={item.card.name}
                              className="w-8 rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.card.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.card.setName}
                              {item.foil && (
                                <span className="ml-2 text-yellow-400">Foil</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{item.condition}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-yellow-400">
                        {item.marketPrice ? fmt(item.marketPrice) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {fmt(item.marketValue)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.costBasis != null ? fmt(item.costBasis) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {item.unrealizedGain != null ? (
                          <span
                            className={
                              item.unrealizedGain >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {item.unrealizedGain >= 0 ? "+" : ""}
                            {fmt(item.unrealizedGain)}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Layout>
  );
}
