"use client";
import { useEffect, useState } from "react";
import api from "../../lib/api";

type MenuItem = { id: number; name: string; price: number };

export default function AdminPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchMenu();
      setItems(Array.isArray(data) ? data : data.data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        price: parseFloat(form.price) || 0,
      };

      if (editingId) {
        await api.updateMenuItem(editingId, payload);
        setEditingId(null);
      } else {
        await api.createMenuItem(payload);
      }

      setForm({ name: "", price: "" });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const edit = (it: MenuItem) => {
    setForm({
      name: it.name,
      price: String(it.price),
    });
    setEditingId(it.id);
  };

  const remove = async (id: number) => {
    if (!confirm("Delete item?")) return;
    await api.deleteMenuItem(id);
    await load();
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        <h1 className="mb-3">Admin — Menu</h1>

        <form onSubmit={submit} className="admin-form">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />

          <div className="flex gap-2">
            <button className="btn btn-primary" type="submit">
              {editingId ? "Update" : "Create"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn btn-light"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", price: "" });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h2>Menu items</h2>

        {loading && <div>Loading…</div>}
        {error && <div className="text-red-500">{String(error)}</div>}

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Price</th><th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{it.name}</td>
                <td>{it.price}</td>
                <td>
                  <button className="btn btn-light" onClick={() => edit(it)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-danger ml-2"
                    onClick={() => remove(it.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h5 className="opacity-50">By meo</h5>
    </div>
  );
}
