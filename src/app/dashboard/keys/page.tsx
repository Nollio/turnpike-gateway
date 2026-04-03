"use client";

import { useState, useEffect, useCallback } from "react";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  provider: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/keys", {
        headers: { "x-org-id": "demo" },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-org-id": "demo",
      },
      body: JSON.stringify({
        name: form.get("name"),
        provider: form.get("provider"),
        upstreamKey: form.get("upstreamKey"),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setNewKeyResult(data.rawKey);
      setShowCreate(false);
      fetchKeys();
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create Key
        </button>
      </div>

      {/* New key result */}
      {newKeyResult && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 space-y-2">
          <div className="text-sm font-medium text-success">Key created! Copy it now — it won&apos;t be shown again.</div>
          <code className="block bg-card p-3 rounded-lg text-sm font-mono break-all">
            {newKeyResult}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(newKeyResult);
              setNewKeyResult(null);
            }}
            className="text-sm text-accent hover:text-accent-light"
          >
            Copy & dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-card border border-border rounded-xl p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold">Create Gateway Key</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Name</label>
              <input
                name="name"
                required
                placeholder="e.g., Production Backend"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Provider</label>
              <select
                name="provider"
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Upstream API Key</label>
            <input
              name="upstreamKey"
              type="password"
              required
              placeholder="sk-..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="border border-border text-muted hover:text-foreground px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Keys table */}
      <div className="bg-card border border-border rounded-xl p-6">
        {loading ? (
          <div className="text-muted text-sm">Loading...</div>
        ) : keys.length === 0 ? (
          <div className="text-muted text-sm">No API keys yet. Create one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-left border-b border-border">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Key</th>
                <th className="pb-3 font-medium">Provider</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Last Used</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b border-border/50">
                  <td className="py-3 font-medium">{key.name}</td>
                  <td className="py-3 font-mono text-muted">{key.key_prefix}...</td>
                  <td className="py-3 capitalize">{key.provider}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        key.is_active
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {key.is_active ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="py-3 text-muted">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="py-3 text-muted">
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
