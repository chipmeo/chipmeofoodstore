"use client";
import { useEffect, useState } from 'react';
import api from '../../lib/api';

type MenuItem = { id: number; name: string; price: number };

export default function SalesPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [basket, setBasket] = useState<{item:MenuItem, qty:number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // show which API base the client is using (helps debug env / CORS issues)
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.chipmeo.io.vn');

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const data = await api.fetchMenu();
      setItems(Array.isArray(data) ? data : data.data ?? []);

    } catch (e:any) {
      // show full error and encourage checking console/network tab
      console.error('fetchMenu failed:', e);
      setMessage(String(e.message || e));
    } finally { setLoading(false); }
  };

  const add = (it: MenuItem) => {
    setBasket(b => {
      const idx = b.findIndex(x => x.item.id === it.id);
      if (idx >= 0) {
        const copy = [...b]; copy[idx].qty += 1; return copy;
      }
      return [...b, { item: it, qty: 1 }];
    });
  };

  const submitOrder = async () => {
    if (basket.length === 0) return setMessage('Basket is empty');
    const orderItems = basket.map(b => ({ menu_item_id: b.item.id, quantity: b.qty }));
    try {
      const res = await api.createOrder({ items: orderItems });
      setMessage('Order created: ' + (res.id || JSON.stringify(res)));
      setBasket([]);
    } catch (e:any) {
      setMessage(e.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Sales POS</h1>
      <div style={{ marginBottom: 8, fontSize: 12, color: '#444' }}>API base: <strong>{API_BASE}</strong></div>
      {loading && <div>Loading menu…</div>}
      {message && <div style={{ margin: 8, color: 'teal' }}>{message}</div>} 
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h2>Menu</h2>
          <ul>
            {items.map(it => (
              <li key={it.id} style={{ marginBottom: 8 }}>
                <strong>{it.name}</strong> — {it.price} VND
                <button style={{ marginLeft: 8 }} onClick={() => add(it)}>Add</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ width: 320 }}>
          <h2>Basket</h2>
          <ul>
            {basket.map(b => (
              <li key={b.item.id}>{b.item.name} × {b.qty} = {b.item.price * b.qty}</li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <button onClick={submitOrder}>Create Order</button>
          </div>
        </div>
      </div>
    </div>
  );
}
