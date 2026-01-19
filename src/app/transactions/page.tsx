"use client";

import { useState, useMemo } from "react";
import {
    Plus,
    Search,
    Filter,
    ArrowUpCircle,
    ArrowDownCircle,
    X,
    Calendar as CalendarIcon,
    Wallet as WalletIcon,
    Tag,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Pencil,
    Trash2
} from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { useFinance, Transaction } from "@/context/FinanceContext";

export default function TransactionsPage() {
    const {
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        accounts,
        categories,
        isLoading
    } = useFinance();

    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: "Todas",
        minAmount: "",
        maxAmount: "",
        startDate: "",
        endDate: ""
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"expense" | "income">("expense");
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        label: "",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        category_id: "",
        account_id: accounts[0]?.id || "",
        notes: ""
    });

    const currentCategories = useMemo(() =>
        categories.filter(c => modalType === 'income' ? c.isIncome : !c.isIncome)
        , [categories, modalType]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const cat = categories.find(c => c.id === t.category_id);
            const catName = cat?.name || "";
            const matchesSearch = t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                catName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filters.category === "Todas" || t.category === filters.category || catName === filters.category;
            const matchesMin = !filters.minAmount || t.amount >= parseFloat(filters.minAmount);
            const matchesMax = !filters.maxAmount || t.amount <= parseFloat(filters.maxAmount);
            const tDate = new Date(t.date);
            const matchesStart = !filters.startDate || tDate >= new Date(filters.startDate + "T00:00:00");
            const matchesEnd = !filters.endDate || tDate <= new Date(filters.endDate + "T23:59:59");
            return matchesSearch && matchesCategory && matchesMin && matchesMax && matchesStart && matchesEnd;
        });
    }, [transactions, searchTerm, filters, categories]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                date: new Date(formData.date + "T12:00:00").toISOString(),
                label: formData.label,
                category_id: formData.category_id || currentCategories[0]?.id,
                category: "", // Legacy
                account_id: formData.account_id,
                account: "", // Legacy
                amount: parseFloat(formData.amount),
                type: modalType,
                notes: formData.notes
            };

            if (editingId) {
                await updateTransaction(editingId, payload);
            } else {
                await addTransaction(payload);
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                label: "",
                amount: "",
                date: format(new Date(), "yyyy-MM-dd"),
                category_id: "",
                account_id: accounts[0]?.id || "",
                notes: ""
            });
        } catch (error) {
            console.error("Error saving transaction:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            alert("No se pudo guardar la transacción: " + errorMessage);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este movimiento?")) return;
        try {
            await deleteTransaction(id);
        } catch (error) {
            console.error("Error deleting transaction:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            alert("No se pudo eliminar el movimiento: " + errorMessage);
        }
    };

    const openAddModal = (type: "expense" | "income") => {
        setModalType(type);
        setEditingId(null);
        const filtered = categories.filter(c => type === 'income' ? c.isIncome : !c.isIncome);
        setFormData({
            label: "",
            amount: "",
            date: format(new Date(), "yyyy-MM-dd"),
            category_id: filtered[0]?.id || "",
            account_id: accounts[0]?.id || "",
            notes: ""
        });
        setIsModalOpen(true);
    };

    const openEditModal = (t: Transaction) => {
        setEditingId(t.id);
        setModalType(t.type as "expense" | "income");
        setFormData({
            label: t.label,
            amount: t.amount.toString(),
            date: format(new Date(t.date), "yyyy-MM-dd"),
            category_id: t.category_id || "",
            account_id: t.account_id,
            notes: t.notes || ""
        });
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Movimientos</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <Tag className="w-4 h-4 text-blue-600" />
                        Historial de transacciones
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openAddModal("income")}
                        className="btn-secondary h-14 px-8 bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50 flex items-center gap-2 rounded-2xl font-black transition-all"
                    >
                        <ArrowUpCircle className="w-5 h-5" />
                        <span>Ingreso</span>
                    </button>
                    <button
                        onClick={() => openAddModal("expense")}
                        className="btn-primary h-14 px-8 bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100 flex items-center gap-2 rounded-2xl font-black transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Gasto</span>
                    </button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por concepto o categoría..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "px-6 py-4 rounded-2xl border font-black flex items-center gap-2 transition-all shadow-sm",
                            showFilters ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                        )}
                    >
                        <Filter className="w-5 h-5" />
                        Filtros
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
                    </button>
                </div>

                {showFilters && (
                    <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Categoría</label>
                                <select
                                    value={filters.category}
                                    onChange={e => setFilters({ ...filters, category: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="Todas">Todas las categorías</option>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Rango de Monto</label>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Mín" value={filters.minAmount} onChange={e => setFilters({ ...filters, minAmount: e.target.value })} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-bold outline-none" />
                                    <input type="number" placeholder="Máx" value={filters.maxAmount} onChange={e => setFilters({ ...filters, maxAmount: e.target.value })} className="w-1/2 p-3 bg-gray-50 border-none rounded-xl font-bold outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Desde</label>
                                <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hasta</label>
                                <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold outline-none" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Fecha</th>
                                <th className="px-8 py-5">Movimiento</th>
                                <th className="px-8 py-5">Categoría / Cuenta</th>
                                <th className="px-8 py-5 text-right">Monto</th>
                                <th className="px-8 py-5 text-center w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map(t => {
                                    const cat = categories.find(c => c.id === t.category_id);
                                    const catName = cat?.name || "Sin categoría";
                                    const accName = accounts.find(a => a.id === t.account_id)?.name || "Cuenta borrada";
                                    return (
                                        <tr key={t.id} className="group hover:bg-blue-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900">{format(new Date(t.date), "dd/MM")}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(t.date), "yyyy")}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0",
                                                        t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                    )}>
                                                        {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{t.label}</span>
                                                        {t.notes && (
                                                            <span className="text-[10px] font-medium text-gray-400 line-clamp-1 italic">{t.notes}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700">{catName}</span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{accName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={cn(
                                                    "text-lg font-black tracking-tight",
                                                    t.type === 'income' ? "text-emerald-600" : "text-gray-900"
                                                )}>
                                                    {t.type === 'income' ? "+" : "-"}${t.amount.toLocaleString('es-AR')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(t)}
                                                        className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t.id)}
                                                        className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-12 h-12 text-gray-200 mb-2" />
                                            <p className="text-gray-500 font-bold">No se encontraron movimientos</p>
                                            <p className="text-gray-400 text-xs font-medium">Prueba ajustando los filtros de búsqueda</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Creation/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className={cn(
                            "p-10 text-white relative",
                            modalType === 'income' ? "bg-emerald-600" : "bg-red-600"
                        )}>
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                                <X className="w-8 h-8" />
                            </button>
                            <h2 className="text-3xl font-black tracking-tight mb-2">
                                {editingId ? "Editar " : "Nuevo "}
                                {modalType === 'income' ? "Ingreso" : "Gasto"}
                            </h2>
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Completa los datos del movimiento</p>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Concepto / Etiqueta</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej: Sueldo, Supermercado..."
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Monto ($)</label>
                                    <input
                                        required
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fecha</label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            required
                                            type="date"
                                            className="w-full pl-12 p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Categoría</label>
                                    <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 outline-none appearance-none focus:ring-2 focus:ring-blue-500/20"
                                            value={formData.category_id}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            {currentCategories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cuenta</label>
                                    <div className="relative">
                                        <WalletIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 outline-none appearance-none focus:ring-2 focus:ring-blue-500/20"
                                            value={formData.account_id}
                                            onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                                        >
                                            {accounts.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Notas / Detalles</label>
                                <textarea
                                    placeholder="Información adicional del movimiento..."
                                    rows={3}
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className={cn(
                                        "w-full py-5 text-white rounded-[1.5rem] font-black text-lg transition-all shadow-xl hover:-translate-y-1",
                                        modalType === 'income' ? "bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700" : "bg-red-600 shadow-red-100 hover:bg-red-700"
                                    )}
                                >
                                    {editingId ? "Guardar Cambios" : (modalType === 'income' ? "Registrar Ingreso" : "Registrar Gasto")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
