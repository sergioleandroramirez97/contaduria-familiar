"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useFinance } from "@/context/FinanceContext";
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    Settings,
    Calendar,
    Layers,
    PiggyBank,
    ChevronRight,
    HelpCircle,
    UserCircle,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Movimientos', href: '/transactions', icon: Receipt },
    { name: 'Cuentas', href: '/accounts', icon: Wallet },
    { name: 'Servicios', href: '/services', icon: Calendar },
    { name: 'Ahorros', href: '/savings', icon: PiggyBank },
    { name: 'Categorías', href: '/categories', icon: Layers },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useFinance();

    if (!user) return null;

    return (
        <aside className="w-72 hidden md:flex flex-col h-screen bg-white border-r border-gray-100 sticky top-0">
            {/* Header / Logo */}
            <div className="p-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-black text-gray-900 tracking-tight block">EcoFam</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Smart Finance</span>
                    </div>
                </div>
            </div>

            {/* Menu Sections */}
            <div className="flex-1 px-4 py-2 overflow-y-auto space-y-8">
                <div>
                    <span className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">
                        Menú Principal
                    </span>
                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-xl shadow-blue-100"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={cn(
                                            "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                            isActive ? "text-white" : "text-gray-400"
                                        )} />
                                        <span className="font-bold text-sm">{item.name}</span>
                                    </div>
                                    {isActive && <ChevronRight className="w-4 h-4 text-white/50" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sub-menu or Extra Context */}
                <div>
                    <span className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">
                        Configuración
                    </span>
                    <nav className="space-y-1">
                        <Link href="/settings" className="group flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-2xl transition-all font-bold text-sm">
                            <Settings className="w-5 h-5 text-gray-400" />
                            <span>Ajustes</span>
                        </Link>
                        <Link href="/help" className="group flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-2xl transition-all font-bold text-sm">
                            <HelpCircle className="w-5 h-5 text-gray-400" />
                            <span>Centro de Ayuda</span>
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Bottom Section: Profile */}
            <div className="p-4 border-t border-gray-50 flex flex-col gap-2">
                <div className="bg-gray-50 rounded-[2rem] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.user_metadata?.avatar_url ? (
                            <Image src={user.user_metadata.avatar_url} alt="User" width={40} height={40} className="object-cover" />
                        ) : (
                            <UserCircle className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate">
                            {user.email?.split('@')[0]}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate">
                            {user.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 px-6 py-3.5 text-red-500 hover:bg-red-50 font-bold text-xs rounded-2xl transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
