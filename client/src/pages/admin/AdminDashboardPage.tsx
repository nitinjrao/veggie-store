import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Package,
  ShoppingCart,
  AlertTriangle,
  ChevronRight,
  Users,
  IndianRupee,
  Refrigerator,
  UserCheck,
  AlertCircle,
  CircleDot,
  CheckCircle2,
  Timer,
  MapPin,
  RefreshCw,
  Activity,
  Boxes,
  TriangleAlert,
  ArrowRight,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { adminService } from '../../services/adminService';
import type {
  DashboardStats,
  DashboardFridgeHealth,
  DashboardStaffActivity,
  DashboardTransporterActivity,
} from '../../services/adminService';
import type { FridgeOrderStatus } from '../../types';
import { FRIDGE_ORDER_STATUS_STYLES } from '../../utils/statusStyles';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  firebaseUid: string | null;
}

const roleColors: Record<string, { bg: string; text: string; accent: string }> = {
  PRODUCER: { bg: 'bg-blue-50', text: 'text-blue-700', accent: 'bg-blue-500' },
  SUPPLIER: { bg: 'bg-orange-50', text: 'text-orange-700', accent: 'bg-orange-500' },
  TRANSPORTER: { bg: 'bg-violet-50', text: 'text-violet-700', accent: 'bg-violet-500' },
};

const HEALTH_PRIORITY: Record<string, number> = { critical: 0, warning: 1, healthy: 2 };

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [dashData, staffRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.listStaff().catch(() => []),
      ]);
      setStats(dashData);
      const staff = Array.isArray(staffRes) ? staffRes : staffRes.staff || [];
      setStaffList(staff.filter((s: StaffMember) => s.active !== false));
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  const revenueToday = Number(stats?.revenueToday || 0);
  const totalRevenue = Number(stats?.totalRevenue || 0);
  const attentionItems = stats?.attentionItems || [];
  const hasCritical = attentionItems.some((a) => a.severity === 'critical');

  // Sort fridges: critical first, then warning, then healthy — show top 4
  const allFridges = [...(stats?.fridgeHealth || [])].sort(
    (a, b) => (HEALTH_PRIORITY[a.health] ?? 2) - (HEALTH_PRIORITY[b.health] ?? 2)
  );
  const displayFridges = allFridges.slice(0, 4);
  const remainingFridges = allFridges.length - 4;

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-dark">
            Welcome back, {user?.name || 'Admin'}
          </h1>
          <p className="text-text-muted text-sm mt-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-primary-green" />
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary-green transition-colors px-3 py-2 rounded-xl hover:bg-green-50 border border-transparent hover:border-green-100"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {refreshing ? 'Refreshing...' : formatTimeAgo(lastRefresh)}
          </span>
        </button>
      </div>

      {/* ── Attention Banner ────────────────────────────────── */}
      {attentionItems.length > 0 && (
        <div
          className={`rounded-2xl border px-5 py-4 ${
            hasCritical ? 'bg-red-50/70 border-red-200' : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center ${hasCritical ? 'bg-red-100' : 'bg-amber-100'}`}
            >
              <AlertCircle
                className={`w-3.5 h-3.5 ${hasCritical ? 'text-red-600' : 'text-amber-600'}`}
              />
            </div>
            <h3 className={`text-sm font-bold ${hasCritical ? 'text-red-800' : 'text-amber-800'}`}>
              Attention Required
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {attentionItems.map((item, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
                  item.severity === 'critical'
                    ? 'bg-red-100/80 text-red-700 border border-red-200/50'
                    : 'bg-amber-100/80 text-amber-700 border border-amber-200/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    item.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {item.message}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 stagger-children">
        <StatCard
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subValue={
            revenueToday > 0 ? `+₹${revenueToday.toLocaleString('en-IN')} today` : undefined
          }
          icon={IndianRupee}
          gradient="from-emerald-500 to-emerald-600"
          link="/admin/analytics"
        />
        <StatCard
          label="Orders Today"
          value={stats?.ordersToday ?? 0}
          icon={ShoppingCart}
          gradient="from-blue-500 to-blue-600"
          link="/admin/orders"
        />
        <StatCard
          label="Pending"
          value={stats?.pendingOrderCount ?? 0}
          icon={Clock}
          gradient="from-amber-500 to-orange-500"
          link="/admin/orders?status=PENDING"
          highlight={(stats?.pendingOrderCount ?? 0) > 0}
        />
        <StatCard
          label="Active Fridges"
          value={stats?.totalActiveFridges ?? 0}
          icon={Refrigerator}
          gradient="from-violet-500 to-purple-600"
          link="/admin/pickup-points"
        />
        <StatCard
          label="Active Staff"
          value={stats?.totalActiveStaff ?? 0}
          icon={Users}
          gradient="from-sky-500 to-cyan-500"
          link="/admin/staff"
        />
      </div>

      {/* ── Order Pipeline ──────────────────────────────────── */}
      <OrderPipeline
        pending={stats?.pendingOrderCount ?? 0}
        confirmed={stats?.confirmedOrderCount ?? 0}
        ready={stats?.readyOrderCount ?? 0}
      />

      {/* ── Fridge Health (top 4) + Staff Activity ──────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <FridgeHealthGrid
            fridges={displayFridges}
            totalCount={allFridges.length}
            remaining={remainingFridges}
          />
        </div>
        <div className="xl:col-span-2">
          <StaffActivityPanel staff={stats?.staffActivity || []} />
        </div>
      </div>

      {/* ── Transporter Activity ────────────────────────────── */}
      {(stats?.transporterActivity || []).length > 0 && (
        <TransporterActivityPanel transporters={stats?.transporterActivity || []} />
      )}

      {/* ── Recent Orders + Low Stock ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersPanel orders={stats?.recentOrders || []} />
        <LowStockPanel items={stats?.lowStockItems || []} />
      </div>

      {/* ── Staff Quick Reference ───────────────────────────── */}
      {staffList.length > 0 && <StaffLoginsPanel staffList={staffList} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Stat Card
   ═══════════════════════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  gradient,
  link,
  highlight,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  gradient: string;
  link: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={link}
      className={`group relative bg-white rounded-2xl border shadow-card hover:shadow-card-hover p-4 transition-all duration-300 overflow-hidden hover:-translate-y-0.5 ${
        highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'
      }`}
    >
      {highlight && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      )}
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm`}
      >
        <Icon className="w-[18px] h-[18px] text-white" />
      </div>
      <p className="text-[22px] font-bold text-text-dark tracking-tight leading-none">{value}</p>
      {subValue && <p className="text-[10px] text-primary-green font-semibold mt-1">{subValue}</p>}
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest">
          {label}
        </p>
        <ChevronRight className="w-3.5 h-3.5 text-gray-200 group-hover:text-primary-green group-hover:translate-x-0.5 transition-all duration-300" />
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Order Pipeline
   ═══════════════════════════════════════════════════════════════ */

function OrderPipeline({
  pending,
  confirmed,
  ready,
}: {
  pending: number;
  confirmed: number;
  ready: number;
}) {
  const total = pending + confirmed + ready;
  if (total === 0) return null;

  const stages = [
    {
      label: 'Pending',
      count: pending,
      color: 'bg-amber-400',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      link: '/admin/orders?status=PENDING',
    },
    {
      label: 'Confirmed',
      count: confirmed,
      color: 'bg-blue-400',
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      link: '/admin/orders?status=CONFIRMED',
    },
    {
      label: 'Ready for Pickup',
      count: ready,
      color: 'bg-emerald-400',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      link: '/admin/orders?status=READY',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-dark flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-green" />
          Order Pipeline
          <span className="text-xs font-normal text-text-muted ml-1">({total} active)</span>
        </h2>
        <Link
          to="/admin/orders"
          className="text-xs text-primary-green hover:underline font-medium flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {stages.map((stage, i) => (
          <div key={stage.label} className="contents">
            {i > 0 && <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0" />}
            <Link
              to={stage.link}
              className={`flex-1 ${stage.bg} border ${stage.border} rounded-xl p-3 hover:shadow-sm transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${stage.text}`}>
                  {stage.label}
                </span>
                <span className={`text-xl font-bold ${stage.text}`}>{stage.count}</span>
              </div>
              <div className="w-full bg-white/60 rounded-full h-1.5">
                <div
                  className={`${stage.color} h-1.5 rounded-full transition-all duration-700 ease-out`}
                  style={{
                    width: `${Math.max((stage.count / total) * 100, stage.count > 0 ? 10 : 0)}%`,
                  }}
                />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Fridge Health Grid — shows top 4, sorted by severity
   ═══════════════════════════════════════════════════════════════ */

const HEALTH_CONFIG = {
  healthy: {
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    ring: 'ring-emerald-100',
    text: 'text-emerald-700',
    label: 'Healthy',
  },
  warning: {
    dot: 'bg-amber-400',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    ring: 'ring-amber-100',
    text: 'text-amber-700',
    label: 'Warning',
  },
  critical: {
    dot: 'bg-red-400',
    bg: 'bg-red-50',
    border: 'border-red-200',
    ring: 'ring-red-100',
    text: 'text-red-700',
    label: 'Critical',
  },
};

function FridgeHealthGrid({
  fridges,
  totalCount,
  remaining,
}: {
  fridges: DashboardFridgeHealth[];
  totalCount: number;
  remaining: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-dark flex items-center gap-2">
          <Boxes className="w-4 h-4 text-violet-500" />
          Fridge Status
          <span className="text-xs font-normal text-text-muted ml-1">({totalCount} active)</span>
        </h2>
        <Link
          to="/admin/pickup-points"
          className="text-xs text-primary-green hover:underline font-medium flex items-center gap-1"
        >
          All Fridges <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {fridges.length === 0 ? (
        <div className="text-center py-10">
          <Refrigerator className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-text-muted">No active fridges</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fridges.map((fridge) => (
              <FridgeCard key={fridge.id} fridge={fridge} />
            ))}
          </div>

          {remaining > 0 && (
            <Link
              to="/admin/pickup-points"
              className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-200 text-sm text-text-muted hover:text-primary-green hover:border-primary-green transition-colors group"
            >
              <span className="font-medium">
                +{remaining} more fridge{remaining > 1 ? 's' : ''}
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </>
      )}
    </div>
  );
}

function FridgeCard({ fridge }: { fridge: DashboardFridgeHealth }) {
  const config = HEALTH_CONFIG[fridge.health];
  const totalOrders = fridge.pendingOrders + fridge.confirmedOrders + fridge.readyOrders;

  return (
    <Link
      to={`/admin/fridges/${fridge.id}/inventory`}
      className={`block rounded-xl border ${config.border} p-3.5 hover:shadow-sm transition-all group relative overflow-hidden`}
    >
      {/* Subtle health accent line */}
      <div className={`absolute top-0 left-0 w-full h-0.5 ${config.dot}`} />

      <div className="flex items-start justify-between mb-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-bold text-text-dark truncate group-hover:text-primary-green transition-colors">
            {fridge.name}
          </h3>
          <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5" />
            {fridge.location || 'No location'}
          </p>
        </div>
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${config.bg} ${config.text} uppercase tracking-wider`}
        >
          {config.label}
        </span>
      </div>

      <div className="flex gap-1.5 mb-2.5">
        <MetricChip value={fridge.totalItems} label="Items" />
        <MetricChip value={totalOrders} label="Orders" highlight={totalOrders > 0} />
        <MetricChip value={`${fridge.totalStock}`} label="kg" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 min-w-0">
          <UserCheck className="w-3 h-3 text-text-muted flex-shrink-0" />
          {fridge.producers.length > 0 ? (
            <span className="text-[11px] text-text-muted truncate">
              {fridge.producers.map((p) => p.name).join(', ')}
            </span>
          ) : (
            <span className="text-[11px] text-red-500 font-semibold">Unassigned</span>
          )}
        </div>
        {fridge.lowStockCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
            <TriangleAlert className="w-3 h-3" />
            {fridge.lowStockCount}
          </span>
        )}
      </div>
    </Link>
  );
}

function MetricChip({
  value,
  label,
  highlight,
}: {
  value: string | number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex-1 text-center py-1.5 rounded-lg ${highlight ? 'bg-blue-50' : 'bg-gray-50/80'}`}
    >
      <span className={`text-sm font-bold ${highlight ? 'text-blue-700' : 'text-text-dark'}`}>
        {value}
      </span>
      <span className={`text-[9px] ml-0.5 ${highlight ? 'text-blue-500' : 'text-text-muted'}`}>
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Staff Activity Panel
   ═══════════════════════════════════════════════════════════════ */

function StaffActivityPanel({ staff }: { staff: DashboardStaffActivity[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-dark flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-500" />
          Staff Activity
          <span className="text-xs font-normal text-text-muted ml-1">Today</span>
        </h2>
        <Link
          to="/admin/staff"
          className="text-xs text-primary-green hover:underline font-medium flex items-center gap-1"
        >
          Manage <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-10">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-text-muted">No active producers</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => {
            const isActive = member.totalActionsToday > 0;
            return (
              <div
                key={member.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  isActive
                    ? 'border-green-200 bg-gradient-to-r from-green-50/50 to-transparent'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${
                      isActive
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-dark truncate">{member.name}</p>
                    {member.assignedFridges.length > 0 && (
                      <p className="text-[10px] text-text-muted truncate">
                        {member.assignedFridges.length} fridge
                        {member.assignedFridges.length > 1 ? 's' : ''} assigned
                      </p>
                    )}
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between bg-blue-50/60 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-blue-500" />
                      <span className="text-[11px] text-blue-600">Confirmed</span>
                    </div>
                    <span className="text-sm font-bold text-blue-700">
                      {member.ordersConfirmedToday}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-emerald-50/60 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3 h-3 text-emerald-500" />
                      <span className="text-[11px] text-emerald-600">Ready</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-700">
                      {member.ordersReadyToday}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Transporter Activity Panel
   ═══════════════════════════════════════════════════════════════ */

function TransporterActivityPanel({
  transporters,
}: {
  transporters: DashboardTransporterActivity[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-dark flex items-center gap-2">
          <Truck className="w-4 h-4 text-violet-500" />
          Transporter Activity
          <span className="text-xs font-normal text-text-muted ml-1">Today</span>
        </h2>
        <Link
          to="/admin/staff"
          className="text-xs text-primary-green hover:underline font-medium flex items-center gap-1"
        >
          Manage <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {transporters.map((t) => {
          const isActive = t.pickupsToday > 0;
          return (
            <div
              key={t.id}
              className={`rounded-xl border p-3.5 transition-all ${
                isActive
                  ? 'border-violet-200 bg-gradient-to-r from-violet-50/50 to-transparent'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${
                    isActive
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {t.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-dark truncate">{t.name}</p>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-violet-500" />
                    <span className="text-[11px] text-violet-600">
                      {t.pickupsToday} pickup{t.pickupsToday !== 1 ? 's' : ''} today
                    </span>
                  </div>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Recent Orders
   ═══════════════════════════════════════════════════════════════ */

const STATUS_ICON_MAP: Record<string, { icon: React.ElementType; bg: string; fg: string }> = {
  PENDING: { icon: Timer, bg: 'bg-amber-100', fg: 'text-amber-600' },
  CONFIRMED: { icon: CircleDot, bg: 'bg-blue-100', fg: 'text-blue-600' },
  READY: { icon: Package, bg: 'bg-emerald-100', fg: 'text-emerald-600' },
  PICKED_UP: { icon: CheckCircle2, bg: 'bg-green-100', fg: 'text-green-600' },
  CANCELLED: { icon: AlertCircle, bg: 'bg-gray-100', fg: 'text-gray-500' },
};

function RecentOrdersPanel({ orders }: { orders: DashboardStats['recentOrders'] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-dark flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-blue-500" />
          Recent Orders
        </h2>
        <Link
          to="/admin/orders"
          className="text-xs text-primary-green hover:underline font-medium flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-text-muted">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {orders.map((order) => {
            const statusCfg = STATUS_ICON_MAP[order.status] || STATUS_ICON_MAP.CANCELLED;
            const StatusIcon = statusCfg.icon;
            return (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="flex items-center gap-3 py-2.5 px-3 -mx-1 rounded-xl hover:bg-gray-50/80 transition-all group"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${statusCfg.bg}`}
                >
                  <StatusIcon className={`w-4 h-4 ${statusCfg.fg}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-dark group-hover:text-primary-green transition-colors">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${FRIDGE_ORDER_STATUS_STYLES[order.status as FridgeOrderStatus] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">
                    {order.customer?.name || order.customer?.phone}
                    {order._count.items > 0 && <> &middot; {order._count.items} items</>}
                    {order.refrigerator && <> &middot; {order.refrigerator.name}</>}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-text-dark">
                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {formatTimeAgo(new Date(order.createdAt))}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Low Stock Alerts
   ═══════════════════════════════════════════════════════════════ */

function LowStockPanel({ items }: { items: DashboardStats['lowStockItems'] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-dark flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Low Stock Alerts
          {items.length > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">
              {items.length}
            </span>
          )}
        </h2>
        <Link
          to="/admin/vegetables"
          className="text-xs text-primary-green hover:underline font-medium flex items-center gap-1"
        >
          Manage <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-primary-green" />
          </div>
          <p className="text-sm font-semibold text-text-dark">All stocks healthy</p>
          <p className="text-xs text-text-muted mt-1">No items below threshold</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {items.map((item) => {
            const stockNum = Number(item.stockKg);
            const thresholdNum = Number(item.minStockAlert);
            const pct = thresholdNum > 0 ? Math.min((stockNum / thresholdNum) * 100, 100) : 0;
            const isOut = stockNum === 0;

            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 py-2.5 px-3 -mx-1 rounded-xl transition-colors ${isOut ? 'bg-red-50/60' : 'hover:bg-gray-50/50'}`}
              >
                <span className="text-lg flex-shrink-0">{item.emoji || '🥬'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-text-dark truncate">
                      {item.name}
                    </span>
                    <span
                      className={`text-xs font-bold ml-2 flex-shrink-0 px-2 py-0.5 rounded-md ${isOut ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                    >
                      {stockNum.toFixed(1)} kg
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${isOut ? 'bg-red-400' : pct < 30 ? 'bg-amber-400' : 'bg-yellow-400'}`}
                      style={{ width: `${Math.max(pct, isOut ? 0 : 4)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Staff Quick Reference
   ═══════════════════════════════════════════════════════════════ */

function StaffLoginsPanel({ staffList }: { staffList: StaffMember[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-text-dark flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          Staff Directory
          <span className="text-xs font-normal text-text-muted ml-1">({staffList.length})</span>
        </h2>
        <Link
          to="/admin/staff"
          className="text-xs text-primary-green hover:underline font-medium flex items-center gap-1"
        >
          Manage <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {staffList.map((s) => {
          const rc = roleColors[s.role] || {
            bg: 'bg-gray-50',
            text: 'text-gray-600',
            accent: 'bg-gray-400',
          };
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white ${rc.accent} shadow-sm`}
              >
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-dark truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold ${rc.text} uppercase tracking-wider`}>
                    {s.role.toLowerCase()}
                  </span>
                  {s.firebaseUid ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                      <AlertCircle className="w-2.5 h-2.5" /> No login
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Skeleton Loader
   ═══════════════════════════════════════════════════════════════ */

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 shimmer rounded-lg w-56 mb-2" />
        <div className="h-4 shimmer rounded-lg w-72" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-4 h-[110px] shimmer"
          />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 h-24 shimmer" />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 h-72 shimmer" />
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 h-72 shimmer" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 h-56 shimmer" />
        <div className="bg-white rounded-2xl border border-gray-100 p-5 h-56 shimmer" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
