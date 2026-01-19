"use client";

import { useState } from "react";
import {
    Plus,
    Trash2,
    Edit2,
    Layers,
    Tag as TagIcon,
    X,
    ChevronRight,
    Search,
    Loader2
} from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { cn } from "@/lib/utils";

// Types
import type { Category } from "@/context/FinanceContext";

const COLORS = [
    "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500",
    "bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500",
    "bg-fuchsia-500", "bg-pink-500", "bg-rose-500", "bg-gray-500"
];

export default function CategoriesPage() {
    const { categories, addCategory, updateCategory, deleteCategory: contextDeleteCategory, isLoading } = useFinance();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Form State
    const [formData, setFormData] = useState<Partial<Category>>({
        name: "",
        color: COLORS[0],
        subcategories: [],
        isIncome: false
    });
    const [newSubCategory, setNewSubCategory] = useState("");

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && formData.id) {
                await updateCategory(formData.id, formData);
            } else {
                await addCategory({
                    name: formData.name || "Nueva Categoría",
                    color: formData.color || COLORS[0],
                    subcategories: formData.subcategories || [],
                    isIncome: formData.isIncome || false
                });
            }
            closeModal();
        } catch (error) {
            console.error("Error saving category:", error);
            alert("Error al guardar la categoría");
        }
    };

    const openEditModal = (cat: Category) => {
        setFormData(cat);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditing(false);
        setFormData({ name: "", color: COLORS[0], subcategories: [], isIncome: false });
        setNewSubCategory("");
    };

    const deleteCategory = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta categoría y todas sus subcategorías?")) {
            try {
                await contextDeleteCategory(id);
            } catch (error) {
                console.error("Error deleting category:", error);
                alert("Error al eliminar");
            }
        }
    };

    const addSubCategory = () => {
        if (newSubCategory.trim() && !formData.subcategories?.includes(newSubCategory.trim())) {
            setFormData({
                ...formData,
                subcategories: [...(formData.subcategories || []), newSubCategory.trim()]
            });
            setNewSubCategory("");
        }
    };

    const removeSubCategory = (sub: string) => {
        setFormData({
            ...formData,
            subcategories: formData.subcategories?.filter(s => s !== sub)
        });
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
                    <h1 className="text-3xl font-bold tracking-tight">Categorías y Organización</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Estructura tus finanzas personales con categorías y subgrupos.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Categoría
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-6">
                    {/* Search Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar categorías..."
                            className="bg-transparent border-none outline-none font-medium flex-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-6">
                        {/* Expenses Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Gastos e Egresos</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {filteredCategories.filter(c => !c.isIncome).map(cat => (
                                    <CategoryCard
                                        key={cat.id}
                                        category={cat}
                                        onEdit={() => openEditModal(cat)}
                                        onDelete={() => deleteCategory(cat.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Incomes Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Ingresos y Entradas</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {filteredCategories.filter(c => c.isIncome).map(cat => (
                                    <CategoryCard
                                        key={cat.id}
                                        category={cat}
                                        onEdit={() => openEditModal(cat)}
                                        onDelete={() => deleteCategory(cat.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="w-full md:w-80 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl">
                        <Layers className="w-12 h-12 mb-6 opacity-20" />
                        <h4 className="text-xl font-black mb-2 tracking-tight">Organización Inteligente</h4>
                        <p className="text-blue-100/70 text-sm leading-relaxed mb-6">
                            Categorizar correctamente tus movimientos es el primer paso para entender en qué se va tu dinero.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10">
                                <div className="text-sm font-bold">Total: {categories.length} grupos</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8 bg-blue-600 text-white relative">
                            <h3 className="text-2xl font-black tracking-tight">{isEditing ? "Editar Grupo" : "Nuevo Grupo de Datos"}</h3>
                            <p className="text-blue-100/70 text-sm mt-1">Personaliza cómo ves tu información financiera.</p>
                            <button onClick={closeModal} className="absolute top-8 right-8 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Nombre del Grupo</label>
                                <input required className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold" placeholder="Ej: Ocio, Inversiones..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Tipo de Movimiento</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setFormData({ ...formData, isIncome: false })} className={cn("p-4 rounded-2xl border-2 transition-all font-bold", !formData.isIncome ? "bg-red-50 border-red-500 text-red-600" : "bg-white border-gray-100 text-gray-400")}>Gasto / Egreso</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, isIncome: true })} className={cn("p-4 rounded-2xl border-2 transition-all font-bold", formData.isIncome ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-white border-gray-100 text-gray-400")}>Ingreso / Entrada</button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Identificador Visual</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setFormData({ ...formData, color: c })} className={cn("w-8 h-8 rounded-full transition-all ring-offset-2", c, formData.color === c && "ring-2 ring-blue-500 scale-125")} />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Subcategorías (Etiquetas)</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.subcategories?.map((sub, i) => (
                                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1">
                                            {sub}
                                            <button type="button" onClick={() => removeSubCategory(sub)}><X className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input className="flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-bold" placeholder="Nueva etiqueta..." value={newSubCategory} onChange={e => setNewSubCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubCategory())} />
                                    <button type="button" onClick={addSubCategory} className="p-3 bg-blue-100 text-blue-600 rounded-xl font-bold hover:bg-blue-200 transition-all">Añadir</button>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black tracking-tight text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                                {isEditing ? "Guardar Grupo" : "Crear Categoría"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function CategoryCard({ category, onEdit, onDelete }: { category: Category, onEdit: () => void, onDelete: () => void }) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100 transition-all group relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("w-4 h-4 rounded-full", category.color)} />
                    <h4 className="font-bold text-gray-900 text-lg">{category.name}</h4>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {category.subcategories.length > 0 ? (
                    category.subcategories.map((sub, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {sub}
                        </span>
                    ))
                ) : (
                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">Sin subcategorías</span>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded", category.isIncome ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                    {category.isIncome ? "Ingreso" : "Gasto"}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
            </div>
        </div>
    );
}
