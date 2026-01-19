"use client";

import { useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target as TargetIcon,
  AlertCircle,
  Loader2
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useFinance } from "@/context/FinanceContext";
import { format, subDays, startOfMonth, isAfter, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Dashboard() {
  const { transactions, accounts, services, savings, categories, isLoading } = useFinance();

  // 1. Calculations
  const totalBalance = useMemo(() =>
    accounts.reduce((acc, a) => acc + a.balance, 0)
    , [accounts]);

  const monthlyExpenses = useMemo(() => {
    const start = startOfMonth(new Date());
    return transactions
      .filter(t => t.type === 'expense' && isAfter(new Date(t.date), start))
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const monthlyIncome = useMemo(() => {
    const start = startOfMonth(new Date());
    return transactions
      .filter(t => t.type === 'income' && isAfter(new Date(t.date), start))
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const totalSavings = useMemo(() =>
    savings.reduce((acc, s) => acc + s.currentAmount, 0)
    , [savings]);

  // 2. Chart Data: Last 7 days flow
  const flowData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayIncome = transactions
        .filter(t => t.type === 'income' && format(new Date(t.date), "yyyy-MM-dd") === dateStr)
        .reduce((acc, t) => acc + t.amount, 0);
      const dayExpense = transactions
        .filter(t => t.type === 'expense' && format(new Date(t.date), "yyyy-MM-dd") === dateStr)
        .reduce((acc, t) => acc + t.amount, 0);

      data.push({
        name: format(date, "EEE", { locale: es }).toUpperCase(),
        ingresos: dayIncome,
        gastos: dayExpense
      });
    }
    return data;
  }, [transactions]);

  // 3. Category Data (Pie Chart)
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const catName = categories.find(c => c.id === t.category_id || c.id === t.category)?.name || "Otros";
      cats[catName] = (cats[catName] || 0) + t.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [transactions, categories]);

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  // 4. Upcoming Services
  const upcomingPayments = useMemo(() => {
    const todayDay = new Date().getDate();
    return services
      .filter(s => s.billingDay >= todayDay)
      .sort((a, b) => a.billingDay - b.billingDay)
      .slice(0, 4);
  }, [services]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-8 p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h1>
          <p className="text-muted-foreground mt-1">
            Hola de nuevo, aquí tienes un resumen de tu economía hoy.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/transactions" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100">
            <Plus className="w-5 h-5" />
            Nuevo Movimiento
          </Link>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Saldo Consolidado"
          amount={`$${totalBalance.toLocaleString('es-AR')}`}
          change="+2.4%"
          trend="up"
          icon={<Wallet className="w-5 h-5 text-blue-500" />}
        />
        <SummaryCard
          title="Gastos del Mes"
          amount={`$${monthlyExpenses.toLocaleString('es-AR')}`}
          change="-1.2%"
          trend="down"
          icon={<Receipt className="w-5 h-5 text-red-500" />}
        />
        <SummaryCard
          title="Ingresos del Mes"
          amount={`$${monthlyIncome.toLocaleString('es-AR')}`}
          change="+5.1%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
        />
        <SummaryCard
          title="Ahorro en Reservas"
          amount={`$${totalSavings.toLocaleString('es-AR')}`}
          change="+12.0%"
          trend="up"
          icon={<TargetIcon className="w-5 h-5 text-orange-500" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-7">
        <div className="col-span-full lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-900">Flujo de Efectivo</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Últimos 7 días</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-full lg:col-span-3 space-y-8">
          {/* Category Pie Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-full">
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-900">Gastos por Categoría</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Distribución histórica</p>
            </div>
            <div className="h-[250px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium italic">
                  No hay gastos cargados aún
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {categoryData.slice(0, 4).map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-bold text-gray-600 truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity and Payments */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black mb-6">Actividad Reciente</h3>
          <div className="space-y-4">
            {transactions.slice(0, 5).map(t => {
              const catName = categories.find(c => c.id === t.category_id || c.id === t.category)?.name || "Sin categoría";
              const accName = accounts.find(a => a.id === t.account_id)?.name || "Cuenta borrada";
              return (
                <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl group-hover:scale-110 transition-all",
                      t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    )}>
                      {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{catName} • {accName}</p>
                    </div>
                  </div>
                  <p className={cn(
                    "font-black text-lg",
                    t.type === 'income' ? "text-emerald-600" : "text-gray-900"
                  )}>
                    {t.type === 'income' ? "+" : "-"}${t.amount.toLocaleString('es-AR')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black mb-6">Próximos Pagos</h3>
          <div className="space-y-4">
            {upcomingPayments.length > 0 ? (
              upcomingPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">
                      {p.billingDay}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">En {p.billingDay - new Date().getDate()} días</p>
                    </div>
                  </div>
                  <p className="font-black text-sm">${p.amount.toLocaleString('es-AR')}</p>
                </div>
              ))
            ) : (
              <div className="p-8 border-2 border-dashed rounded-3xl text-center space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-gray-400 text-sm font-medium">No hay pagos próximos</p>
              </div>
            )}
            <Link href="/services" className="block w-full text-center py-4 text-blue-600 font-black text-sm bg-blue-50 rounded-2xl hover:bg-blue-100 transition-all mt-4">
              Ver Calendario Completo
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ title, amount, change, trend, icon }: { title: string; amount: string; change: string; trend: 'up' | 'down'; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-100/50 group">
      <div className="flex items-center justify-between mb-6">
        <div className="p-4 bg-gray-50 rounded-2xl group-hover:scale-110 group-hover:bg-white group-hover:shadow-lg transition-all">{icon}</div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
          trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em]">{title}</p>
        <h2 className="text-3xl font-black mt-2 text-gray-900 tracking-tight">{amount}</h2>
      </div>
    </div>
  );
}
