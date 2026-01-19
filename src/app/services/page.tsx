"use client";

import { useState, useMemo } from "react";
import {
    Plus,
    Calendar as CalendarIcon,
    Bell,
    ArrowRight,
    RefreshCcw,
    Wifi,
    Tv,
    Home,
    User,
    X,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Edit2,
    Loader2
} from "lucide-react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    getDay,
    addDays,
    startOfWeek,
    endOfWeek,
    isToday,
    parseISO
} from "date-fns";
import { useFinance } from "@/context/FinanceContext";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Types
import type { Service } from "@/context/FinanceContext";

const CATEGORIES = ["Suscripción", "Vivienda", "Hogar", "Salud", "Servicio", "Educación", "Otros"] as const;

const ICON_MAP: Record<string, React.ReactNode> = {
    "Tv": <Tv className="w-5 h-5 text-purple-500" />,
    "Wifi": <Wifi className="w-5 h-5 text-blue-500" />,
    "Home": <Home className="w-5 h-5 text-emerald-500" />,
    "User": <User className="w-5 h-5 text-orange-500" />,
    "Other": <RefreshCcw className="w-5 h-5 text-gray-500" />
};

export default function ServicesPage() {
    const { services, addService, updateService, deleteService: contextDeleteService, isLoading } = useFinance();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Form State
    const [formData, setFormData] = useState<Partial<Service>>({
        name: "",
        category: "Suscripción",
        amount: 0,
        billingDay: 1,
        type: "recurring",
        iconName: "Other",
        endDate: ""
    });

    const totalRecurring = useMemo(() =>
        services.reduce((acc, s) => acc + s.amount, 0)
        , [services]);

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && formData.id) {
                await updateService(formData.id, formData);
            } else {
                await addService({
                    name: formData.name || "Nuevo Servicio",
                    category: formData.category || "Otros",
                    amount: Number(formData.amount) || 0,
                    billingDay: Number(formData.billingDay) || 1,
                    type: (formData.type as 'recurring' | 'fixed') || "recurring",
                    iconName: formData.iconName || "Other",
                    endDate: formData.endDate || undefined
                });
            }
            closeModal();
        } catch (error) {
            console.error("Error saving service:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            alert("Error al guardar el servicio: " + errorMessage);
        }
    };

    const openEditModal = (service: Service) => {
        setFormData(service);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditing(false);
        setFormData({ name: "", category: "Suscripción", amount: 0, billingDay: 1, type: "recurring", iconName: "Other", endDate: "" });
    };

    const deleteService = async (id: string) => {
        if (confirm("¿Seguro que quieres eliminar este servicio?")) {
            try {
                await contextDeleteService(id);
            } catch (error) {
                console.error("Error deleting service:", error);
                const errorMessage = error instanceof Error ? error.message : "Error desconocido";
                alert("Error al eliminar el servicio: " + errorMessage);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Servicios y Suscripciones</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Controla tus gastos fijos y agenda tus próximos pagos.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 border rounded-xl transition-all font-medium text-sm",
                            viewMode === "calendar" ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white hover:bg-gray-50"
                        )}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        {viewMode === "list" ? "Vista Calendario" : "Vista Lista"}
                    </button>
                    <button
                        onClick={() => { setIsEditing(false); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir Servicio
                    </button>
                </div>
            </div>

            {viewMode === "list" ? (
                <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                            <RefreshCcw className="w-5 h-5 text-blue-500" />
                            Gastos Recurrentes
                        </h3>
                        <div className="space-y-3">
                            {services.filter(s => s.type === "recurring").map(s => (
                                <ServiceListItem
                                    key={s.id}
                                    service={s}
                                    onDelete={() => deleteService(s.id)}
                                    onEdit={() => openEditModal(s)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                            <Home className="w-5 h-5 text-emerald-500" />
                            Gastos Fijos del Hogar
                        </h3>
                        <div className="space-y-3">
                            {services.filter(s => s.type === "fixed").map(s => (
                                <ServiceListItem
                                    key={s.id}
                                    service={s}
                                    onDelete={() => deleteService(s.id)}
                                    onEdit={() => openEditModal(s)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <CalendarView
                    currentMonth={currentMonth}
                    setCurrentMonth={setCurrentMonth}
                    services={services}
                />
            )}

            <div className="bg-blue-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-2xl shadow-blue-200">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-2 tracking-tight">Presupuesto Sugerido</h3>
                    <p className="text-blue-100/80 font-medium">Total para el mes de {format(currentMonth, "MMMM", { locale: es })}</p>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tighter">${totalRecurring.toLocaleString('es-AR')}</span>
                        <span className="text-blue-200 font-bold opacity-60">ARS / MES</span>
                    </div>
                </div>
                <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20">
                        <Bell className="w-6 h-6 text-yellow-300 animate-pulse" />
                        <p className="text-sm font-semibold">Recibirás alertas 2 días antes de cada vencimiento</p>
                    </div>
                    <button className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black hover:scale-[1.02] transition-all shadow-xl">
                        Descargar Planilla Mensual
                    </button>
                </div>
                {/* Background Decor */}
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-40" />
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-blue-400 rounded-full blur-[80px] opacity-30" />
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-8 bg-blue-600 text-white relative">
                            <h3 className="text-2xl font-black tracking-tight">{isEditing ? "Editar Servicio" : "Nuevo Servicio Fijo"}</h3>
                            <p className="text-blue-100/70 text-sm mt-1">Configura el cobro automático para tus reportes.</p>
                            <button onClick={closeModal} className="absolute top-8 right-8 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveService} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Concepto / Nombre</label>
                                <input
                                    required
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold"
                                    placeholder="Ej: Spotify, Edesur, Alquiler..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Monto Mensual</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                                        <input
                                            required
                                            type="number"
                                            className="w-full p-4 pl-8 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold"
                                            placeholder="0.00"
                                            value={formData.amount || ""}
                                            onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Día de Cobro</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max="31"
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold"
                                        placeholder="1-31"
                                        value={formData.billingDay || ""}
                                        onChange={e => setFormData({ ...formData, billingDay: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Fecha Fin (Opcional)</label>
                                <input
                                    type="month"
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold"
                                    value={formData.endDate || ""}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Tipo de Gasto</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "recurring" })}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 transition-all font-bold flex items-center justify-center gap-2",
                                            formData.type === "recurring" ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <RefreshCcw className="w-4 h-4" /> Recurrente
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: "fixed" })}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 transition-all font-bold flex items-center justify-center gap-2",
                                            formData.type === "fixed" ? "bg-emerald-50 border-emerald-600 text-emerald-600" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <Home className="w-4 h-4" /> Fijo Hogar
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Categoría</label>
                                <select
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold bg-white"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black tracking-tight text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.01]">
                                Confirmar y Agendar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ServiceListItem({ service, onDelete, onEdit }: { service: Service, onDelete: () => void, onEdit: () => void }) {
    const icon = ICON_MAP[service.iconName] || <RefreshCcw className="w-5 h-5 text-gray-500" />;

    return (
        <div className="bg-white border-2 border-transparent hover:border-blue-100 rounded-2xl p-4 flex items-center justify-between transition-all group hover:shadow-lg hover:shadow-blue-50/50">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-blue-50 group-hover:scale-110 transition-all">
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{service.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">{service.category}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                        <span className="text-[10px] uppercase font-black tracking-wider text-blue-50">Día {service.billingDay}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="font-black text-gray-900">${service.amount.toLocaleString('es-AR')}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Mensual</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button onClick={onEdit} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function CalendarView({ currentMonth, setCurrentMonth, services }: { currentMonth: Date; setCurrentMonth: (d: Date) => void; services: Service[] }) {
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth));
        const end = endOfWeek(endOfMonth(currentMonth));
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    return (
        <div className="bg-white rounded-[2.5rem] border shadow-xl overflow-hidden border-gray-100">
            {/* Calendar Header */}
            <div className="p-8 border-b flex items-center justify-between bg-gray-50/50">
                <div>
                    <h3 className="text-2xl font-black tracking-tight text-gray-900 capitalize">
                        {format(currentMonth, "MMMM yyyy", { locale: es })}
                    </h3>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-1">Agenda de Vencimientos</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 hover:bg-white rounded-2xl border-2 border-transparent hover:border-gray-100 transition-all text-gray-400 hover:text-gray-900">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={() => setCurrentMonth(new Date())} className="px-5 py-2 hover:bg-white rounded-2xl border-2 border-transparent hover:border-gray-100 transition-all text-sm font-black text-blue-600 uppercase tracking-widest">
                        Hoy
                    </button>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 hover:bg-white rounded-2xl border-2 border-transparent hover:border-gray-100 transition-all text-gray-400 hover:text-gray-900">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 border-b bg-gray-50/30">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 divide-x divide-y">
                {days.map((day, idx) => {
                    const isSelectedMonth = day.getMonth() === currentMonth.getMonth();

                    return (
                        <div key={idx} className={cn(
                            "min-h-[140px] p-4 transition-all hover:bg-blue-50/10",
                            !isSelectedMonth && "bg-gray-50/30 opacity-40 grayscale-[0.5]"
                        )}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                    "text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl",
                                    isToday(day) ? "bg-blue-600 text-white shadow-xl shadow-blue-200" : "text-gray-400"
                                )}>
                                    {format(day, "d")}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {services.filter((s: Service) => {
                                    const isDayMatch = s.billingDay === day.getDate() && isSelectedMonth;
                                    if (!isDayMatch) return false;
                                    if (s.endDate) {
                                        const [endYear, endMonth] = s.endDate.split("-").map(Number);
                                        const currentYear = day.getFullYear();
                                        const currentMonthNum = day.getMonth() + 1;
                                        if (currentYear > endYear) return false;
                                        if (currentYear === endYear && currentMonthNum > endMonth) return false;
                                    }
                                    return true;
                                }).map((s: Service) => (
                                    <div
                                        key={s.id}
                                        className={cn(
                                            "text-[9px] font-black p-1.5 rounded-lg border-l-4 truncate shadow-sm",
                                            s.type === 'recurring' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                        )}
                                        title={`${s.name}: $${s.amount.toLocaleString()}`}
                                    >
                                        {s.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
