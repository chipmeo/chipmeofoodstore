"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/api";

type MenuItem = { id: number; name: string; price: number };
type BasketItem = { item: MenuItem; qty: number };

export default function SalesPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Guard clicks that happen too close together (fixes double invoke in React dev strict)
  const lastAddTsRef = useRef<Record<number, number>>({}); // menuItemId -> timestamp

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.chipmeo.io.vn";

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    setLoadingMenu(true);
    setMessage(null);
    try {
      const data = await api.fetchMenu();
      setItems(Array.isArray(data) ? data : data.data ?? []);
    } catch (e: any) {
      console.error(e);
      setMessage(String(e?.message ?? e));
    } finally {
      setLoadingMenu(false);
    }
  }

  // click guard duration (ms)
  const CLICK_GUARD_MS = 250;

  function safeAdd(item: MenuItem) {
    // prevent double-add from strict mode / double-invoke within guard ms
    const now = Date.now();
    const last = lastAddTsRef.current[item.id] || 0;
    if (now - last < CLICK_GUARD_MS) return; // ignore
    lastAddTsRef.current[item.id] = now;

    setBasket((prev) => {
      const idx = prev.findIndex((p) => p.item.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { item, qty: 1 }];
    });
  }

  function inc(itemId: number) {
    setBasket((b) => b.map((x) => x.item.id === itemId ? { ...x, qty: x.qty + 1 } : x));
  }
  function dec(itemId: number) {
    setBasket((b) => {
      const copy = b.map((x) => x.item.id === itemId ? { ...x, qty: x.qty - 1 } : x);
      return copy.filter(x => x.qty > 0);
    });
  }
  function removeItem(itemId: number) {
    setBasket((b) => b.filter(x => x.item.id !== itemId));
  }

  const subtotal = useMemo(() => basket.reduce((s, b) => s + b.item.price * b.qty, 0), [basket]);
  const tax = Math.round(subtotal * 0.08); // example 8% tax, change/remove as needed
  const total = subtotal + tax;

  async function submitOrder() {
    if (basket.length === 0) {
      setMessage("Basket is empty");
      return;
    }
    setPlacingOrder(true);
    setMessage(null);
    const payload = {
      items: basket.map((b) => ({ menu_item_id: b.item.id, quantity: b.qty })),
      meta: { source: "pos" },
    };

    try {
      const res = await api.createOrder(payload);
      setMessage("Order created: " + (res?.id ?? "ok"));
      setBasket([]);
    } catch (e: any) {
      console.error(e);
      setMessage(String(e?.message ?? e));
    } finally {
      setPlacingOrder(false);
    }
  }

  function formatVND(n: number) {
    return n.toLocaleString("vi-VN") + " ₫";
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Sales POS</h1>
          <div className="text-sm text-gray-500">
            API: <span className="font-medium text-gray-700">{API_BASE}</span>
          </div>
        </header>

        {message && (
          <div className="mb-4 rounded-md bg-teal-50 border border-teal-100 px-4 py-2 text-teal-800">
            {message}
          </div>
        )}

        <div className="grid grid-cols-12 gap-4">
          {/* MENU (left) */}
          <section className="col-span-7">
            <div className="bg-white shadow-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium">Menu</h2>
                <div className="text-sm text-gray-500">{loadingMenu ? "Loading…" : `${items.length} items`}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-3 border rounded-md hover:shadow-sm transition">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-gray-500">{formatVND(it.price)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => safeAdd(it)}
                        className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:scale-95"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          // quick add 5
                          for (let i = 0; i < 5; i++) safeAdd(it);
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                        title="Quick add 5"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* BASKET (middle) */}
          <aside className="col-span-3">
            <div className="bg-white shadow-sm rounded-lg p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium">Basket</h2>
                <div className="text-sm text-gray-500">{basket.reduce((s, b) => s + b.qty, 0)} pcs</div>
              </div>

              <div className="flex-1 overflow-auto">
                {basket.length === 0 ? (
                  <div className="text-sm text-gray-400">Basket is empty</div>
                ) : (
                  <ul className="space-y-3">
                    {basket.map((b) => (
                      <li key={b.item.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{b.item.name}</div>
                          <div className="text-xs text-gray-500">{formatVND(b.item.price)}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => dec(b.item.id)}
                            className="px-2 py-1 rounded border text-sm"
                            aria-label="Decrease"
                          >
                            −
                          </button>
                          <div className="w-8 text-center text-sm">{b.qty}</div>
                          <button
                            onClick={() => inc(b.item.id)}
                            className="px-2 py-1 rounded border text-sm"
                            aria-label="Increase"
                          >
                            +
                          </button>

                          <div className="ml-3 text-sm font-medium">{formatVND(b.item.price * b.qty)}</div>

                          <button
                            onClick={() => removeItem(b.item.id)}
                            className="ml-2 text-xs text-red-600"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setBasket([])}
                  className="w-full mb-2 py-2 rounded-md border text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={loadMenu}
                  className="w-full py-2 rounded-md border text-sm"
                >
                  Refresh Menu
                </button>
              </div>
            </div>
          </aside>

          {/* ORDER SUMMARY (right) */}
          <section className="col-span-2">
            <div className="bg-white shadow-sm rounded-lg p-4 flex flex-col h-full">
              <h2 className="text-lg font-medium mb-3">Summary</h2>

              <div className="flex flex-col gap-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatVND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>{formatVND(tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg mt-2">
                  <span>Total</span>
                  <span>{formatVND(total)}</span>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={submitOrder}
                  disabled={placingOrder || basket.length === 0}
                  className={`w-full py-3 rounded-md text-white font-medium ${placingOrder || basket.length === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {placingOrder ? "Placing..." : "Create Order"}
                </button>

                <button
                  onClick={() => {
                    // quick hold: simulate hold order — placeholder for future feature
                    setMessage("Hold order saved (placeholder)");
                  }}
                  className="w-full mt-2 py-2 rounded-md border text-sm"
                >
                  Hold
                </button>
              </div>

              <div className="mt-auto pt-3 text-xs text-gray-400">
                {/* small footer */}
                <div>By meo • POS</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
