"use client";

import { useState, useEffect, useCallback } from "react";

interface UsageData {
  period: string;
  summary: {
    total_requests: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cost_cents: number;
    avg_latency_ms: number;
  };
  byModel: {
    model: string;
    provider: string;
    requests: number;
    input_tokens: number;
    output_tokens: number;
    cost_cents: number;
    avg_latency_ms: number;
  }[];
  byKey: {
    key_name: string;
    key_prefix: string;
    requests: number;
    cost_cents: number;
  }[];
  daily: {
    date: string;
    requests: number;
    cost_cents: number;
  }[];
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with real org ID from auth session
      const res = await fetch(`/api/usage?period=${period}`, {
        headers: { "x-org-id": "demo" },
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          {["24h", "7d", "30d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? "bg-accent text-white"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Spend"
          value={formatCost(data?.summary.total_cost_cents ?? 0)}
          loading={loading}
        />
        <StatCard
          label="Requests"
          value={formatNumber(data?.summary.total_requests ?? 0)}
          loading={loading}
        />
        <StatCard
          label="Total Tokens"
          value={formatNumber(
            (data?.summary.total_input_tokens ?? 0) +
              (data?.summary.total_output_tokens ?? 0)
          )}
          loading={loading}
        />
        <StatCard
          label="Avg Latency"
          value={`${data?.summary.avg_latency_ms ?? 0}ms`}
          loading={loading}
        />
      </div>

      {/* Spend by Model */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Spend by Model</h2>
        {loading ? (
          <div className="text-muted text-sm">Loading...</div>
        ) : data?.byModel.length === 0 ? (
          <div className="text-muted text-sm">No usage data yet. Start making API calls through the gateway.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-left border-b border-border">
                <th className="pb-3 font-medium">Model</th>
                <th className="pb-3 font-medium">Provider</th>
                <th className="pb-3 font-medium text-right">Requests</th>
                <th className="pb-3 font-medium text-right">Tokens</th>
                <th className="pb-3 font-medium text-right">Cost</th>
                <th className="pb-3 font-medium text-right">Avg Latency</th>
              </tr>
            </thead>
            <tbody>
              {data?.byModel.map((row) => (
                <tr key={row.model} className="border-b border-border/50">
                  <td className="py-3 font-mono">{row.model}</td>
                  <td className="py-3 capitalize">{row.provider}</td>
                  <td className="py-3 text-right">{formatNumber(row.requests)}</td>
                  <td className="py-3 text-right">
                    {formatNumber(row.input_tokens + row.output_tokens)}
                  </td>
                  <td className="py-3 text-right font-medium">{formatCost(row.cost_cents)}</td>
                  <td className="py-3 text-right">{row.avg_latency_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Spend by API Key */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Spend by API Key</h2>
        {loading ? (
          <div className="text-muted text-sm">Loading...</div>
        ) : data?.byKey.length === 0 ? (
          <div className="text-muted text-sm">No usage data yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-left border-b border-border">
                <th className="pb-3 font-medium">Key Name</th>
                <th className="pb-3 font-medium">Prefix</th>
                <th className="pb-3 font-medium text-right">Requests</th>
                <th className="pb-3 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {data?.byKey.map((row) => (
                <tr key={row.key_prefix} className="border-b border-border/50">
                  <td className="py-3">{row.key_name}</td>
                  <td className="py-3 font-mono text-muted">{row.key_prefix}...</td>
                  <td className="py-3 text-right">{formatNumber(row.requests)}</td>
                  <td className="py-3 text-right font-medium">{formatCost(row.cost_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Daily Trend */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Daily Spend</h2>
        {loading ? (
          <div className="text-muted text-sm">Loading...</div>
        ) : data?.daily.length === 0 ? (
          <div className="text-muted text-sm">No usage data yet.</div>
        ) : (
          <div className="space-y-2">
            {data?.daily.map((day) => {
              const maxCost = Math.max(...(data?.daily.map((d) => Number(d.cost_cents)) ?? [1]));
              const pct = maxCost > 0 ? (Number(day.cost_cents) / maxCost) * 100 : 0;
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-sm text-muted w-24 shrink-0">{day.date}</span>
                  <div className="flex-1 bg-border/50 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-20 text-right">
                    {formatCost(Number(day.cost_cents))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-bold mt-1">
        {loading ? <span className="text-muted">--</span> : value}
      </div>
    </div>
  );
}

function formatCost(cents: number): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
