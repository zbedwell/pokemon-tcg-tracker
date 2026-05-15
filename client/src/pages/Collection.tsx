import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cardsApi, collectionApi } from "../api";
import { Layout } from "../components/Layout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Card as PokemonCard, Condition } from "../types";

const CONDITIONS: Condition[] = ["NM", "LP", "MP", "HP", "DMG"];

function AddCardModal({
  card,
  onClose,
}: {
  card: PokemonCard;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    quantity: 1,
    condition: "NM" as Condition,
    foil: false,
    purchasePrice: "",
    purchaseDate: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      collectionApi.add({
        cardId: card.id,
        quantity: form.quantity,
        condition: form.condition,
        foil: form.foil,
        purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
        purchaseDate: form.purchaseDate || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection"] });
      toast.success(`${card.name} added to collection`);
      onClose();
    },
    onError: () => toast.error("Failed to add card"),
  });

  const prices = card.tcgplayer?.prices;
  const marketPrice = form.foil
    ? prices?.holofoil?.market
    : prices?.normal?.market;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold">Add to Collection</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-4 mb-5">
            {card.images.small && (
              <img
                src={card.images.small}
                alt={card.name}
                className="w-20 rounded-lg"
              />
            )}
            <div>
              <p className="font-medium">{card.name}</p>
              <p className="text-sm text-gray-400">
                {card.set.name} · #{card.number}
              </p>
              {card.rarity && (
                <p className="text-xs text-gray-500 mt-1">{card.rarity}</p>
              )}
              {marketPrice && (
                <p className="text-sm text-yellow-400 mt-2">
                  Market: ${marketPrice.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))
                }
              />
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
                label="Purchase Price ($)"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.purchasePrice}
                onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
              />
              <Input
                label="Purchase Date"
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                className="accent-yellow-400"
                checked={form.foil}
                onChange={(e) => setForm((f) => ({ ...f, foil: e.target.checked }))}
              />
              Foil / Holo variant
            </label>

            <Input
              label="Notes"
              placeholder="Optional notes..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            className="flex-1"
          >
            Add Card
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Collection() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["card-search", searchQuery],
    queryFn: () =>
      searchQuery ? cardsApi.search(searchQuery).then((r) => r.data.data) : [],
    enabled: !!searchQuery,
  });

  const { data: collection, isLoading } = useQuery({
    queryKey: ["collection"],
    queryFn: () => collectionApi.list().then((r) => r.data),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => collectionApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection"] });
      toast.success("Removed from collection");
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Collection</h1>
        <p className="text-gray-400 text-sm mt-1">
          Search for cards to add to your inventory.
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            placeholder="Search cards — e.g. Charizard, Pikachu..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" loading={searching}>
            <Search className="w-4 h-4" />
            Search
          </Button>
        </form>

        {searchResults && searchResults.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {searchResults.slice(0, 20).map((card) => {
              const market =
                card.tcgplayer?.prices?.holofoil?.market ??
                card.tcgplayer?.prices?.normal?.market;
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-yellow-400/50 transition-all group"
                >
                  {card.images.small ? (
                    <img
                      src={card.images.small}
                      alt={card.name}
                      className="w-full rounded group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full aspect-[5/7] bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500">
                      No image
                    </div>
                  )}
                  <div className="text-center w-full">
                    <p className="text-xs font-medium truncate">{card.name}</p>
                    <p className="text-xs text-gray-500 truncate">{card.set.name}</p>
                    {market && (
                      <p className="text-xs text-yellow-400">${market.toFixed(2)}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {searchResults?.length === 0 && searchQuery && (
          <p className="mt-4 text-sm text-gray-500 text-center">
            No cards found for "{searchQuery}"
          </p>
        )}
      </Card>

      {/* Inventory */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Your Inventory{" "}
          {collection && (
            <span className="text-gray-400 font-normal text-base">
              ({collection.length} items)
            </span>
          )}
        </h2>

        {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}

        {collection && collection.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-gray-400">Your collection is empty.</p>
            <p className="text-sm text-gray-500 mt-1">
              Search for cards above to add them.
            </p>
          </Card>
        )}

        {collection && collection.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {collection.map((item) => {
              const prices = JSON.parse(item.card.pricesJson ?? "{}");
              const market = item.foil
                ? prices.holofoil?.market
                : prices.normal?.market;
              return (
                <Card key={item.id} padding={false}>
                  <div className="flex items-center gap-4 p-4">
                    {item.card.imageSmall && (
                      <img
                        src={item.card.imageSmall}
                        alt={item.card.name}
                        className="w-12 rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.card.name}</p>
                      <p className="text-sm text-gray-400">
                        {item.card.setName} · #{item.card.number}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm shrink-0">
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Qty</p>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Cond.</p>
                        <p className="font-medium">{item.condition}</p>
                      </div>
                      {item.foil && (
                        <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">
                          Foil
                        </span>
                      )}
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Market</p>
                        <p className="font-medium text-yellow-400">
                          {market ? `$${market.toFixed(2)}` : "—"}
                        </p>
                      </div>
                      {item.purchasePrice && (
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Paid</p>
                          <p className="font-medium">
                            ${parseFloat(item.purchasePrice).toFixed(2)}
                          </p>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMutation.mutate(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedCard && (
        <AddCardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </Layout>
  );
}
