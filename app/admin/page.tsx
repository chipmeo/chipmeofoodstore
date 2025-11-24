"use client";
import { useEffect, useState } from 'react';
import api from '../../lib/api';

type MenuItem = { id: number; name: string; price: number; description?: string };

export default function AdminPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', price: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchMenu();
      setItems(Array.isArray(data) ? data : data.data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = { name: form.name, price: parseFloat(form.price) || 0, description: form.description };
      if (editingId) {
        await api.updateMenuItem(editingId, payload);
        setEditingId(null);
      } else {
        await api.createMenuItem(payload);
      }
      setForm({ name: '', price: '', description: '' });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const edit = (it: MenuItem) => {
    setForm({ name: it.name, price: String(it.price), description: it.description || '' });
    setEditingId(it.id);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete menu item?')) return;
    await api.deleteMenuItem(id);
    await load();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin — Menu</h1>
      <section style={{ marginBottom: 20 }}>
        <form onSubmit={submit} style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
          <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div>
            <button type="submit">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', price: '', description: '' }); }}>Cancel</button>}
          </div>
        </form>
      </section>

      <section>
        <h2>Menu items</h2>
        {loading && <div>Loading…</div>}
        {error && <div style={{ color: 'crimson' }}>{String(error)}</div>}
        <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(it => (
              <tr key={String(it.id)}>
                <td>{it.id}</td>
                <td>{it.name}</td>
                <td>{it.price}</td>
                <td>{it.description}</td>
                <td>
                  <button onClick={() => edit(it)}>Edit</button>
                  <button onClick={() => remove(it.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <h5>By meo</h5>
    </div>
  );
}
