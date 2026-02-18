import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Download, IndianRupee, ShoppingCart, Receipt } from 'lucide-react';
import api from '../../services/api';

interface SalesSummary {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  avgOrderValue: number;
  statusBreakdown: { status: string; count: number }[];
}

interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: string;
  name: string;
  emoji: string | null;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

const PERIOD_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [salesData, setSalesData] = useState<DailySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/admin/analytics/summary?days=${days}`).then((r) => r.data),
      api.get(`/admin/analytics/sales?days=${days}`).then((r) => r.data),
      api.get(`/admin/analytics/top-products?days=${days}`).then((r) => r.data),
    ])
      .then(([sum, sales, top]) => {
        setSummary(sum);
        setSalesData(sales);
        setTopProducts(top);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  const handleExport = async () => {
    const { auth } = await import('../../lib/firebase');
    const token = await auth.currentUser?.getIdToken();
    window.open(`/api/admin/analytics/export?days=${days}&token=${token}`, '_blank');
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-heading font-bold text-2xl">Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  days === opt.value
                    ? 'bg-primary-green text-white'
                    : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-text-muted hover:bg-gray-50 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Revenue</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(summary?.revenue ?? 0)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-primary-green" />
            </div>
          </div>
          {summary && summary.revenueChange !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${summary.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.revenueChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(summary.revenueChange)}% vs previous period
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Orders</p>
              <p className="text-2xl font-bold mt-1">{summary?.orders ?? 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          {summary && summary.ordersChange !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${summary.ordersChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.ordersChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(summary.ordersChange)}% vs previous period
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Avg Order Value</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(summary?.avgOrderValue ?? 0)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-medium text-text-dark mb-4">Revenue Trend</h2>
        {salesData.length === 0 ? (
          <p className="text-sm text-text-muted py-8 text-center">No sales data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                labelFormatter={(label: any) => formatDate(String(label))}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Products & Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-medium text-text-dark mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} />
                <Bar dataKey="totalRevenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-medium text-text-dark mb-4">Order Status Breakdown</h2>
          {summary?.statusBreakdown?.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">No data</p>
          ) : (
            <div className="space-y-3">
              {summary?.statusBreakdown?.map((s) => {
                const total = summary.statusBreakdown.reduce((a, b) => a + b.count, 0);
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                const colors: Record<string, string> = {
                  PENDING: 'bg-yellow-400',
                  CONFIRMED: 'bg-blue-400',
                  OUT_FOR_DELIVERY: 'bg-purple-400',
                  DELIVERED: 'bg-green-400',
                  CANCELLED: 'bg-red-400',
                };
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text-dark">{s.status.replace(/_/g, ' ')}</span>
                      <span className="text-text-muted">
                        {s.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors[s.status] || 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
