"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ArrowLeft, TrendingUp, ShoppingBag, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useTranslation } from "@/hooks/useTranslation";

// ──────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────
interface PurchasedItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number | null;
  purchased_at: string;
  list_id: string;
}

interface StatsDashboardProps {
  initialItems: PurchasedItem[];
}

type Period = "month" | "history";

interface ChartDataPoint {
  label: string;
  total: number;
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function getWeekNumber(d: Date): number {
  const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  const firstMonday = new Date(firstDayOfMonth);
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1);
  }
  if (d < firstMonday) return 1;
  const diff = d.getTime() - firstMonday.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 2;
}

function getMonthLabel(d: Date): string {
  return d.toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

// ──────────────────────────────────────────────────────────
// Componente: StatsDashboard (Client)
// ──────────────────────────────────────────────────────────
export default function StatsDashboard({ initialItems }: StatsDashboardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>("month");

  // ── Filtra itens por período ─────────────────────────────
  const filteredItems = useMemo(() => {
    const now = new Date();
    if (period === "month") {
      return initialItems.filter((item) => {
        const d = new Date(item.purchased_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return initialItems.filter((item) => {
      const d = new Date(item.purchased_at);
      return d >= sixMonthsAgo;
    });
  }, [initialItems, period]);

  // ── KPIs ────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = filteredItems.reduce(
      (sum, i) => sum + i.quantity * (i.unit_price ?? 0),
      0
    );
    const itemCount = filteredItems.length;

    const distinctDays = new Set(
      filteredItems.map((i) => i.purchased_at.split("T")[0])
    ).size;

    const avgPerShopping = distinctDays > 0 ? total / distinctDays : 0;

    return { total, itemCount, avgPerShopping, distinctDays };
  }, [filteredItems]);

  // ── Gráfico 1: Evolução Temporal ────────────────────────
  const evolutionData = useMemo((): ChartDataPoint[] => {
    if (period === "month") {
      const weekMap = new Map<number, number>();
      filteredItems.forEach((item) => {
        const d = new Date(item.purchased_at);
        const week = getWeekNumber(d);
        weekMap.set(week, (weekMap.get(week) ?? 0) + item.quantity * (item.unit_price ?? 0));
      });
      const maxWeek = Math.max(1, ...Array.from(weekMap.keys()));
      const result: ChartDataPoint[] = [];
      for (let w = 1; w <= maxWeek; w++) {
        result.push({
          label: t.stats.weekLabel.replace("{week}", String(w)),
          total: weekMap.get(w) ?? 0,
        });
      }
      return result;
    }
    const monthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthMap.set(getMonthLabel(d), 0);
    }
    filteredItems.forEach((item) => {
      const d = new Date(item.purchased_at);
      const label = getMonthLabel(d);
      if (monthMap.has(label)) {
        monthMap.set(label, (monthMap.get(label) ?? 0) + item.quantity * (item.unit_price ?? 0));
      }
    });
    return Array.from(monthMap.entries()).map(([label, total]) => ({ label, total }));
  }, [filteredItems, period, t.stats.weekLabel]);

  // ── Gráfico 2: Top Itens por Impacto Financeiro ──────────
  const topItemsData = useMemo((): ChartDataPoint[] => {
    const itemMap = new Map<string, number>();
    filteredItems.forEach((item) => {
      const displayName = item.name.trim();
      itemMap.set(
        displayName,
        (itemMap.get(displayName) ?? 0) + item.quantity * (item.unit_price ?? 0)
      );
    });
    return Array.from(itemMap.entries())
      .map(([name, total]) => ({ label: name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredItems]);

  // ── Custom Tooltip ──────────────────────────────────────
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] border border-zinc-700 rounded-xl px-3 py-2 shadow-xl">
          <p className="text-sm font-bold text-[#deff9a]">{formatEuro(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-surface-900">
      {/* Header */}
      <header className="bg-surface-800 px-4 pt-12 pb-4 border-b border-surface-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-xl hover:bg-surface-700 transition-colors"
            aria-label={t.stats.backToDashboard}
          >
            <ArrowLeft size={20} className="text-zinc-400" />
          </button>
          <div>
            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
              {t.stats.analytics}
            </p>
            <h1 className="text-xl font-bold text-zinc-100">{t.stats.title}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 space-y-5 pb-28">
        {/* Seletor de período */}
        <div className="flex bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setPeriod("month")}
            className={clsx(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
              period === "month"
                ? "bg-[#deff9a] text-black"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Calendar size={14} className="inline mr-1.5" />
            {t.stats.currentMonth}
          </button>
          <button
            onClick={() => setPeriod("history")}
            className={clsx(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
              period === "history"
                ? "bg-[#deff9a] text-black"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <TrendingUp size={14} className="inline mr-1.5" />
            {t.stats.history6Months}
          </button>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="text-6xl mb-5">📭</span>
            <h2 className="text-lg font-bold text-zinc-300 mb-2">
              {period === "month" ? t.stats.emptyMonthTitle : t.stats.emptyHistoryTitle}
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
              {period === "month"
                ? t.stats.emptyMonthDesc
                : t.stats.emptyHistoryDesc}
            </p>
          </div>
        ) : (
          <>
            {/* Cards KPI */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-3.5 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  {period === "month" ? t.stats.totalMonth : t.stats.total6Months}
                </p>
                <p className="text-lg font-bold text-[#deff9a] truncate">
                  {formatEuro(kpis.total)}
                </p>
              </div>
              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-3.5 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  {t.stats.averageSpend}
                </p>
                <p className="text-lg font-bold text-white">{formatEuro(kpis.avgPerShopping)}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  {kpis.distinctDays} {kpis.distinctDays === 1 ? t.stats.day : t.stats.days}
                </p>
              </div>
              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-3.5 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  {t.stats.items}
                </p>
                <p className="text-lg font-bold text-white">{kpis.itemCount}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{t.stats.processed}</p>
              </div>
            </div>

            {/* Gráfico 1: Evolução Temporal */}
            <section>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#deff9a]" />
                {period === "month" ? t.stats.weeklyTrend : t.stats.monthlyTrend}
              </h3>
              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-4">
                {evolutionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={evolutionData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="#666"
                        tick={{ fontSize: 11, fill: "#999" }}
                        axisLine={{ stroke: "#333" }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#666"
                        tick={{ fontSize: 11, fill: "#999" }}
                        axisLine={{ stroke: "#333" }}
                        tickLine={false}
                        tickFormatter={(v: number) => `€${v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" fill="#deff9a" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {evolutionData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill="#deff9a"
                            fillOpacity={index === evolutionData.length - 1 ? 1 : 0.6}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-zinc-500 text-sm py-8">
                    {t.stats.insufficientData}
                  </p>
                )}
              </div>
            </section>

            {/* Gráfico 2: Top Itens por Impacto */}
            <section>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <ShoppingBag size={16} className="text-[#deff9a]" />
                {t.stats.topBudgetImpact}
              </h3>
              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-4">
                {topItemsData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(topItemsData.length * 36, 200)}
                  >
                    <BarChart
                      data={topItemsData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#666"
                        tick={{ fontSize: 10, fill: "#999" }}
                        axisLine={{ stroke: "#333" }}
                        tickLine={false}
                        tickFormatter={(v: number) => `€${v}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        stroke="#666"
                        tick={{ fontSize: 11, fill: "#ccc" }}
                        axisLine={{ stroke: "#333" }}
                        tickLine={false}
                        width={100}
                        tickFormatter={(v: string) =>
                          v.length > 14 ? v.slice(0, 13) + "\u2026" : v
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" fill="#deff9a" radius={[0, 6, 6, 0]} maxBarSize={20}>
                        {topItemsData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill="#deff9a"
                            fillOpacity={1 - index * 0.07}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-zinc-500 text-sm py-8">
                    {t.stats.insufficientData}
                  </p>
                )}
              </div>
              <p className="text-xs text-zinc-600 mt-1.5 px-1">
                {t.stats.budgetImpactNote}
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}