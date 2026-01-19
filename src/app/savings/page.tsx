"use client";

import { useState, useMemo } from "react";
import {
    Plus,
    PiggyBank,
    Target,
    Calendar,
    TrendingUp,
    X,
    ArrowUpCircle,
    Trash2,
    Edit2,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { format, differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// Types
import type { SavingGoal } from "@/context/FinanceContext";

export default function SavingsPage() {
    const { savings, addSavingGoal, updateSavingGoal, deleteSavingGoal: contextDeleteGoal, addSavingDeposit, isLoading } = useFinance();

    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null);

    // Form States
    const [goalForm, setGoalForm] = useState<Partial<SavingGoal>>({
        name: "",
        targetAmount: 0,
        deadline: format(new Date(), "yyyy-MM-dd"),
        category: "General",
        currentAmount: 0
    });
    const [depositAmount, setDepositAmount] = useState("");

    const handleSaveGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && goalForm.id) {
                await updateSavingGoal(goalForm.id, goalForm);
            } else {
                await addSavingGoal({
                    name: goalForm.name || "Nueva Reserva",
                    targetAmount: Number(goalForm.targetAmount) || 0,
                    currentAmount: Number(goalForm.currentAmount) || 0,
                    deadline: goalForm.deadline || format(new Date(), "yyyy-MM-dd"),
                    category: goalForm.category || "General",
                    icon: "Target"
                });
            }
            closeGoalModal();
        } catch (error) {
            console.error("Error saving goal:", error);
            alert("Error al guardar la reserva");
        }
    };

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedGoal && depositAmount) {
            try {
                await addSavingDeposit(selectedGoal.id, Number(depositAmount));
                setIsDepositModalOpen(false);
                setDepositAmount("");
                setSelectedGoal(null);
            } catch (error) {
                console.error("Error adding deposit:", error);
                alert("Error al sumar ahorro");
            }
        }
    };

    const closeGoalModal = () => {
        setIsGoalModalOpen(false);
        setIsEditing(false);
        setGoalForm({ name: "", targetAmount: 0, deadline: format(new Date(), "yyyy-MM-dd"), category: "General", currentAmount: 0 });
    };

    const deleteGoal = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta reserva?")) {
            try {
                await contextDeleteGoal(id);
            } catch (error) {
                console.error("Error deleting goal:", error);
                alert("Error al eliminar");
            }
        }
    };

    const totalSaved = savings.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalTarget = savings.reduce((acc, g) => acc + g.targetAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

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
                    <h1 className="text-3xl font-bold tracking-tight">Mis Reservas y Ahorros</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Define objetivos, plazos y visualiza tu progreso hacia lo que quieres.
                    </p>
                </div>
                <button
                    onClick={() => setIsGoalModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Crear Nueva Reserva
                </button>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                        <PiggyBank className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Ahorro Total</p>
                        <p className="text-2xl font-black text-gray-900">${totalSaved.toLocaleString('es-AR')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                        <Target className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Meta Global</p>
                        <p className="text-2xl font-black text-gray-900">${totalTarget.toLocaleString('es-AR')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-orange-50 rounded-2xl text-orange-600">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Progreso General</p>
                        <div className="flex items-center gap-3">
                            <p className="text-2xl font-black text-gray-900">{overallProgress.toFixed(1)}%</p>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(overallProgress, 100)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {savings.map(goal => (
                    <GoalCard
                        key={goal.id}
                        goal={goal}
                        onDeposit={() => { setSelectedGoal(goal); setIsDepositModalOpen(true); }}
                        onEdit={() => { setGoalForm(goal); setIsEditing(true); setIsGoalModalOpen(true); }}
                        onDelete={() => deleteGoal(goal.id)}
                    />
                ))}
            </div>

            {/* Modal: New/Edit Goal */}
            {isGoalModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={closeGoalModal}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8 bg-blue-600 text-white relative">
                            <h3 className="text-2xl font-black tracking-tight">{isEditing ? "Editar Reserva" : "Nueva Reserva de Ahorro"}</h3>
                            <p className="text-blue-100/70 text-sm mt-1">Define tu objetivo para mantenerte motivado.</p>
                            <button onClick={closeGoalModal} className="absolute top-8 right-8 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveGoal} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nombre del Objetivo</label>
                                <input required className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold" placeholder="Ej: Auto Nuevo, Fondo de Paz Mental..." value={goalForm.name} onChange={e => setGoalForm({ ...goalForm, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Monto Objetivo</label>
                                    <input required type="number" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold" placeholder="0" value={goalForm.targetAmount || ""} onChange={e => setGoalForm({ ...goalForm, targetAmount: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Ahorro Actual</label>
                                    <input type="number" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold" placeholder="0" value={goalForm.currentAmount || ""} onChange={e => setGoalForm({ ...goalForm, currentAmount: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Fecha Límite</label>
                                <input required type="date" className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold" value={goalForm.deadline} onChange={e => setGoalForm({ ...goalForm, deadline: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black tracking-tight text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                                {isEditing ? "Guardar Cambios" : "Comenzar mi Reserva"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Deposit */}
            {isDepositModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setIsDepositModalOpen(false)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-sm:max-w-xs max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-8 bg-emerald-600 text-white relative">
                            <h3 className="text-2xl font-black tracking-tight">Sumar a Reserva</h3>
                            <p className="text-emerald-100/70 text-sm mt-1">{selectedGoal?.name}</p>
                            <button onClick={() => setIsDepositModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleDeposit} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Monto a agregar</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                                    <input required autoFocus type="number" className="w-full p-5 pl-10 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-2xl font-black text-gray-900" placeholder="0.00" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black tracking-tight text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all">
                                Confirmar Ahorro
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function GoalCard({ goal, onDeposit, onEdit, onDelete }: { goal: SavingGoal, onDeposit: () => void, onEdit: () => void, onDelete: () => void }) {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysLeft = differenceInDays(parseISO(goal.deadline), new Date());
    const isCompleted = progress >= 100;

    return (
        <div className="bg-white rounded-[2rem] border-2 border-transparent hover:border-blue-100 p-8 shadow-sm transition-all group relative overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-blue-50/50">
            {isCompleted && (
                <div className="absolute top-4 right-4 text-emerald-500">
                    <CheckCircle2 className="w-8 h-8 fill-emerald-50" />
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-gray-50 rounded-[1.5rem] group-hover:bg-blue-50 transition-colors">
                    <Target className={cn("w-8 h-8", isCompleted ? "text-emerald-500" : "text-blue-600")} />
                </div>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1">
                <h3 className="text-xl font-black text-gray-900 mb-1">{goal.name}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{goal.category}</p>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ahorrado</p>
                            <p className="text-2xl font-black text-gray-900">${goal.currentAmount.toLocaleString('es-AR')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Objetivo</p>
                            <p className="text-lg font-bold text-gray-500">${goal.targetAmount.toLocaleString('es-AR')}</p>
                        </div>
                    </div>

                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                isCompleted ? "bg-emerald-500" : "bg-blue-600"
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className={cn(isCompleted ? "text-emerald-600" : "text-blue-600")}>{progress.toFixed(0)}% Completado</span>
                        <span className="text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {daysLeft > 0 ? `Faltan ${daysLeft} días` : isCompleted ? "¡Logrado!" : "Vencido"}
                        </span>
                    </div>
                </div>
            </div>

            {!isCompleted && (
                <button
                    onClick={onDeposit}
                    className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-600 hover:scale-[1.02] transition-all shadow-lg"
                >
                    <ArrowUpCircle className="w-5 h-5" />
                    Sumar a Reserva
                </button>
            )}
        </div>
    );
}
