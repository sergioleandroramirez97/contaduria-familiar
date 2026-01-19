"use client";

import { useState } from "react";
import {
    Plus,
    Wallet,
    CreditCard,
    Banknote,
    Building2,
    X,
    ArrowUpCircle,
    Trash2,
    Edit2,
    ChevronRight,
    Search,
    TrendingUp,
    BarChart3,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/context/FinanceContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ACCOUNT_TYPES = ["Efectivo", "Caja de Ahorro", "Billetera Virtual", "Tarjeta de Crédito", "Inversiones"];

export default function AccountsPage() {
    const { accounts, transactions, isLoading, addAccount, updateAccount, deleteAccount, addDeposit } = useFinance();

    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);

    // Form States
    const [accountForm, setAccountForm] = useState({ name: "", type: ACCOUNT_TYPES[0], balance: "" });
    const [depositAmount, setDepositAmount] = useState("");

    const handleSaveAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditMode && selectedAccount) {
                await updateAccount(selectedAccount.id, {
                    name: accountForm.name,
                    type: accountForm.type
                });
            } else {
                await addAccount({
                    name: accountForm.name,
                    type: accountForm.type,
                    balance: parseFloat(accountForm.balance) || 0,
                });
            }
            closeAccountModal();
        } catch (error) {
            console.error("Error saving account:", error);
            alert("Error al guardar la cuenta");
        }
    };

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccount || !depositAmount) return;
        try {
            await addDeposit(selectedAccount.id, parseFloat(depositAmount));
            setIsDepositModalOpen(false);
            setDepositAmount("");
            setSelectedAccount(null);
        } catch (error) {
            console.error("Error adding deposit:", error);
            alert("Error al sumar saldo");
        }
    };

    const closeAccountModal = () => {
        setIsAccountModalOpen(false);
        setIsEditMode(false);
        setSelectedAccount(null);
        setAccountForm({ name: "", type: ACCOUNT_TYPES[0], balance: "" });
    };

    const openEditModal = (acc: any) => {
        setSelectedAccount(acc);
        setAccountForm({ name: acc.name, type: acc.type, balance: acc.balance.toString() });
        setIsEditMode(true);
        setIsAccountModalOpen(true);
    };

    const recentMovements = transactions.slice(0, 8);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full space-y-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Gestión de Cuentas</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Administra tus bancos, billeteras y efectivo en un solo lugar.
                    </p>
                </div>
                <button
                    onClick={() => setIsAccountModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Cuenta
                </button>
            </div>

            {/* Account Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map(acc => (
                    <AccountCard
                        key={acc.id}
                        account={acc}
                        onAddAmount={() => {
                            setSelectedAccount(acc);
                            setIsDepositModalOpen(true);
                        }}
                        onEdit={() => openEditModal(acc)}
                        onDelete={async () => {
                            if (confirm(`¿Estás seguro de borrar la cuenta ${acc.name}?`)) {
                                try {
                                    await deleteAccount(acc.id);
                                } catch (error) {
                                    console.error("Error deleting account:", error);
                                    alert("No se pudo borrar la cuenta");
                                }
                            }
                        }}
                    />
                ))}
            </div>

            {/* Activity and Insights Section */}
            <div className="grid gap-8 lg:grid-cols-7">
                <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Movimientos por Cuenta</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Historial reciente</p>
                        </div>
                        <Search className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-4">Fecha</th>
                                    <th className="px-8 py-4">Cuenta</th>
                                    <th className="px-8 py-4">Concepto</th>
                                    <th className="px-8 py-4 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentMovements.length > 0 ? (
                                    recentMovements.map(t => {
                                        const accountName = accounts.find(a => a.id === t.account_id)?.name || t.account;
                                        return (
                                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-tighter">
                                                    {format(new Date(t.date), "dd MMM")}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{accountName}</span>
                                                </td>
                                                <td className="px-8 py-5 text-sm font-medium text-gray-600">{t.label}</td>
                                                <td className={cn(
                                                    "px-8 py-5 text-right font-black text-base tracking-tight",
                                                    t.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                                                )}>
                                                    {t.type === 'income' ? '+' : '-'} ${t.amount.toLocaleString('es-AR')}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-10 text-center text-gray-400 text-sm font-medium italic">Sin movimientos recientes</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <TrendingUp className="absolute -right-4 -bottom-4 w-40 h-40 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                        <h4 className="text-2xl font-black mb-2 tracking-tight">Análisis de Liquidez</h4>
                        <p className="text-blue-100/70 text-sm leading-relaxed mb-6">Tus activos están distribuidos principalmente en cuentas bancarias. Considera mover el excedente a inversiones.</p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <span className="text-xs font-bold uppercase tracking-wider">Cuentas Activas</span>
                                <span className="text-xl font-black">{accounts.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: New/Edit Account */}
            {isAccountModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={closeAccountModal}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8 bg-blue-600 text-white relative">
                            <h3 className="text-2xl font-black tracking-tight">{isEditMode ? 'Editar Cuenta' : 'Nueva Cuenta'}</h3>
                            <p className="text-blue-100/70 text-sm mt-1">Configura donde guardas tu dinero.</p>
                            <button onClick={closeAccountModal} className="absolute top-8 right-8 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAccount} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nombre Identificador</label>
                                <input required type="text" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold" placeholder="Ej: BBVA Ahorros" value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tipo de Activo</label>
                                <select className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}>
                                    {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            {!isEditMode && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Monto de Apertura</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                                        <input required type="number" className="w-full p-4 pl-10 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold" placeholder="0.00" value={accountForm.balance} onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })} />
                                    </div>
                                </div>
                            )}
                            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black tracking-tight text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                                {isEditMode ? 'Guardar Cambios' : 'Apertura de Cuenta'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Deposit */}
            {isDepositModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => { setIsDepositModalOpen(false); setSelectedAccount(null); }}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8 bg-emerald-600 text-white relative">
                            <h3 className="text-2xl font-black tracking-tight">Carga de Fondos</h3>
                            <p className="text-emerald-100/70 text-sm mt-1">Suma manual a "{selectedAccount?.name}"</p>
                            <button onClick={() => { setIsDepositModalOpen(false); setSelectedAccount(null); }} className="absolute top-8 right-8 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleDeposit} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Monto a agregar</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                                    <input required autoFocus type="number" className="w-full p-5 pl-10 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-2xl font-black text-gray-900" placeholder="0.00" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black tracking-tight text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all">
                                Confirmar y Sumar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function AccountCard({ account, onAddAmount, onEdit, onDelete }: any) {
    const { name, type, balance, is_credit } = account;

    const getIcon = () => {
        if (type === "Efectivo") return <Banknote className="w-7 h-7" />;
        if (type === "Tarjeta de Crédito") return <CreditCard className="w-7 h-7" />;
        if (type === "Caja de Ahorro") return <Building2 className="w-7 h-7" />;
        if (type === "Inversiones") return <BarChart3 className="w-7 h-7" />;
        return <Wallet className="w-7 h-7" />;
    };

    const getColors = () => {
        if (type === "Efectivo") return "from-emerald-600 to-teal-500 shadow-emerald-100";
        if (type === "Tarjeta de Crédito") return "from-rose-600 to-red-500 shadow-red-100";
        if (type === "Caja de Ahorro") return "from-amber-500 to-orange-500 shadow-orange-100";
        if (type === "Inversiones") return "from-indigo-600 to-blue-500 shadow-indigo-100";
        return "from-slate-700 to-slate-600 shadow-slate-100";
    };

    return (
        <div className="group relative">
            <div className={cn(
                "h-64 rounded-[2.5rem] bg-gradient-to-br p-8 text-white shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]",
                getColors()
            )}>
                <div className="flex justify-between items-start mb-8">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        {getIcon()}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button onClick={onAddAmount} className="p-2.5 bg-white/20 hover:bg-white/40 rounded-xl backdrop-blur-md transition-all">
                            <ArrowUpCircle className="w-5 h-5 text-white" />
                        </button>
                        <button onClick={onEdit} className="p-2.5 bg-white/20 hover:bg-white/40 rounded-xl backdrop-blur-md transition-all">
                            <Edit2 className="w-5 h-5 text-white" />
                        </button>
                        <button onClick={onDelete} className="p-2.5 bg-white/20 hover:bg-red-500 rounded-xl backdrop-blur-md transition-all">
                            <Trash2 className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                <div className="mt-auto">
                    <p className="text-sm font-bold opacity-70 mb-1">{type}</p>
                    <h3 className="text-xl font-black tracking-tight truncate mb-4">{name}</h3>

                    <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Balance</p>
                            <p className="text-2xl font-black tracking-tighter">
                                ${balance.toLocaleString('es-AR')}
                            </p>
                        </div>
                        <ChevronRight className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity translate-x-1" />
                    </div>
                </div>
            </div>
        </div>
    );
}
