"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type Transaction = {
    id: string;
    date: string;
    label: string;
    notes?: string;
    category: string;
    category_id?: string;
    account: string;
    account_id: string;
    amount: number;
    type: 'expense' | 'income' | 'transfer';
};

export type Account = {
    id: string;
    name: string;
    type: string;
    balance: number;
    is_credit?: boolean;
};

export type Service = {
    id: string;
    name: string;
    category: string;
    amount: number;
    billingDay: number;
    type: 'recurring' | 'fixed';
    iconName: string;
    endDate?: string;
};

export type SavingGoal = {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    category: string;
    icon: string;
};

export type Category = {
    id: string;
    name: string;
    color: string;
    subcategories: string[];
    isIncome: boolean;
};

interface FinanceContextType {
    accounts: Account[];
    transactions: Transaction[];
    services: Service[];
    savings: SavingGoal[];
    categories: Category[];
    isLoading: boolean;
    user: any;
    refreshData: () => Promise<void>;
    signOut: () => Promise<void>;
    addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    addAccount: (a: Omit<Account, 'id' | 'balance'> & { balance: number }) => Promise<void>;
    updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
    deleteAccount: (id: string) => Promise<void>;
    addDeposit: (accountId: string, amount: number) => Promise<void>;
    // Services
    addService: (s: Omit<Service, 'id'>) => Promise<void>;
    updateService: (id: string, updates: Partial<Service>) => Promise<void>;
    deleteService: (id: string) => Promise<void>;
    // Savings
    addSavingGoal: (g: Omit<SavingGoal, 'id'>) => Promise<void>;
    updateSavingGoal: (id: string, updates: Partial<SavingGoal>) => Promise<void>;
    deleteSavingGoal: (id: string) => Promise<void>;
    addSavingDeposit: (id: string, amount: number) => Promise<void>;
    // Categories
    addCategory: (c: Omit<Category, 'id'>) => Promise<void>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [savings, setSavings] = useState<SavingGoal[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data: { user: supabaseUser } } = await supabase.auth.getUser();
            if (!supabaseUser) {
                setUserId(null);
                setUser(null);
                setIsLoading(false);
                return;
            }
            setUserId(supabaseUser.id);
            setUser(supabaseUser);

            const [
                { data: accs },
                { data: trans },
                { data: servs },
                { data: savs },
                { data: cats }
            ] = await Promise.all([
                supabase.from('accounts').select('*').order('name'),
                supabase.from('transactions').select('*').order('date', { ascending: false }),
                supabase.from('services').select('*').order('billing_day'),
                supabase.from('savings').select('*').order('deadline'),
                supabase.from('categories').select('*').order('name')
            ]);

            setAccounts(accs?.map(a => ({ ...a, is_credit: a.is_credit })) || []);
            setTransactions(trans?.map(t => ({
                id: t.id,
                date: t.date,
                label: t.label,
                notes: t.notes,
                category_id: t.category_id,
                category: t.category_id || '', // Legacy sync
                account_id: t.account_id,
                account: t.account_id || '', // Legacy sync
                amount: Number(t.amount),
                type: t.type
            })) || []);
            setServices(servs?.map(s => ({
                id: s.id,
                name: s.name,
                category: s.category,
                amount: Number(s.amount),
                billingDay: s.billing_day,
                type: s.type,
                iconName: s.icon_name,
                endDate: s.end_date
            })) || []);
            setSavings(savs?.map(s => ({
                id: s.id,
                name: s.name,
                targetAmount: Number(s.target_amount),
                currentAmount: Number(s.current_amount),
                deadline: s.deadline,
                category: s.category,
                icon: s.icon
            })) || []);
            setCategories(cats?.map(c => ({
                id: c.id,
                name: c.name,
                color: c.color,
                subcategories: c.subcategories || [],
                isIncome: c.is_income
            })) || []);

        } catch (error) {
            console.error("Error fetching finance data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchData();
        });
        return () => subscription.unsubscribe();
    }, []);

    // Helpers
    const getUserIdOrThrow = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No hay una sesión activa. Debes iniciar sesión.");
        return user.id;
    };

    // CRUD - Transactions
    const addTransaction = async (t: Omit<Transaction, 'id'>) => {
        const uid = await getUserIdOrThrow();

        // Find account UUID if name was passed
        const targetAccount = accounts.find(a => a.id === t.account_id || a.name === (t as any).account);
        if (!targetAccount) throw new Error("Cuenta no encontrada");

        const { error } = await supabase.from('transactions').insert([{
            user_id: uid,
            account_id: targetAccount.id,
            label: t.label,
            notes: t.notes,
            amount: t.amount,
            type: t.type,
            date: t.date,
            category_id: t.category_id || null
        }]);

        if (error) throw error;

        // Update local account balance
        const modifier = t.type === 'income' ? 1 : -1;
        await updateAccount(targetAccount.id, { balance: targetAccount.balance + (t.amount * modifier) });

        await fetchData();
    };

    const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
        const uid = await getUserIdOrThrow();
        const oldT = transactions.find(t => t.id === id);
        if (!oldT) throw new Error("Transacción no encontrada");

        // 1. Deshacer efecto anterior
        const oldAcc = accounts.find(a => a.id === oldT.account_id);
        if (oldAcc) {
            const mod = oldT.type === 'income' ? -1 : 1;
            await supabase.from('accounts').update({ balance: oldAcc.balance + (oldT.amount * mod) }).eq('id', oldAcc.id);
        }

        // 2. Aplicar actualización
        const { error } = await supabase.from('transactions').update({
            label: updates.label,
            notes: updates.notes,
            amount: updates.amount,
            type: updates.type,
            date: updates.date,
            category_id: updates.category_id || null,
            account_id: updates.account_id,
            user_id: uid
        }).eq('id', id);

        if (error) throw error;

        // 3. Aplicar nuevo efecto
        const { data: refreshedAccs } = await supabase.from('accounts').select('*');
        const targetAccId = updates.account_id || oldT.account_id;
        const targetAcc = (refreshedAccs || []).find(a => a.id === targetAccId);

        if (targetAcc) {
            const newType = updates.type || oldT.type;
            const newAmount = updates.amount !== undefined ? updates.amount : oldT.amount;
            const mod = newType === 'income' ? 1 : -1;
            await supabase.from('accounts').update({ balance: targetAcc.balance + (newAmount * mod) }).eq('id', targetAcc.id);
        }

        await fetchData();
    };

    const deleteTransaction = async (id: string) => {
        await getUserIdOrThrow();
        const t = transactions.find(item => item.id === id);
        if (!t) return;

        // Revertir balance
        const targetAccount = accounts.find(a => a.id === t.account_id);
        if (targetAccount) {
            const modifier = t.type === 'income' ? -1 : 1;
            await supabase.from('accounts').update({ balance: targetAccount.balance + (t.amount * modifier) }).eq('id', targetAccount.id);
        }

        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
    };

    // CRUD - Accounts
    const addAccount = async (a: Omit<Account, 'id'>) => {
        const uid = await getUserIdOrThrow();

        // 1. Create the account with the initial balance
        const { data: newAccount, error: accError } = await supabase.from('accounts').insert([{
            user_id: uid,
            name: a.name,
            type: a.type,
            balance: a.balance,
            is_credit: a.is_credit || false
        }]).select().single();

        if (accError) throw accError;

        // 2. Create the opening transaction directly in Supabase
        // We do it directly to avoid the "Account not found" error because 
        // the state (accounts) hasn't updated yet.
        const { error: transError } = await supabase.from('transactions').insert([{
            user_id: uid,
            account_id: newAccount.id,
            label: `Apertura: ${a.name}`,
            amount: a.balance,
            type: "income",
            date: new Date().toISOString(),
            category_id: null
        }]);

        if (transError) throw transError;

        // 3. Sync everything
        await fetchData();
    };

    const updateAccount = async (id: string, updates: Partial<Account>) => {
        await getUserIdOrThrow();
        const { error } = await supabase.from('accounts').update(updates).eq('id', id);
        if (error) throw error;
        await fetchData();
    };

    const deleteAccount = async (id: string) => {
        await getUserIdOrThrow();
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
    };

    const addDeposit = async (accountId: string, amount: number) => {
        const acc = accounts.find(a => a.id === accountId);
        if (!acc) return;
        await addTransaction({
            date: new Date().toISOString(),
            label: `Depósito/Suma manual`,
            category_id: undefined,
            category: "Varios",
            account_id: acc.id,
            account: acc.name,
            amount: amount,
            type: "income"
        });
    };

    // Services
    const addService = async (s: Omit<Service, 'id'>) => {
        const uid = await getUserIdOrThrow();
        const { error } = await supabase.from('services').insert([{
            user_id: uid,
            name: s.name,
            category: s.category,
            amount: s.amount,
            billing_day: s.billingDay,
            type: s.type,
            icon_name: s.iconName,
            end_date: s.endDate || null
        }]);
        if (error) throw error;
        await fetchData();
    };

    const updateService = async (id: string, updates: Partial<Service>) => {
        await getUserIdOrThrow();
        const formattedUpdates: any = { ...updates };
        if (updates.billingDay) formattedUpdates.billing_day = updates.billingDay;
        if (updates.iconName) formattedUpdates.icon_name = updates.iconName;
        if (updates.endDate) formattedUpdates.end_date = updates.endDate;

        const { error } = await supabase.from('services').update(formattedUpdates).eq('id', id);
        if (error) throw error;
        await fetchData();
    };

    const deleteService = async (id: string) => {
        await getUserIdOrThrow();
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
    };

    // Savings
    const addSavingGoal = async (g: Omit<SavingGoal, 'id'>) => {
        const uid = await getUserIdOrThrow();
        const { error } = await supabase.from('savings').insert([{
            user_id: uid,
            name: g.name,
            target_amount: g.targetAmount,
            current_amount: g.currentAmount,
            deadline: g.deadline,
            category: g.category,
            icon: g.icon
        }]);
        if (error) throw error;
        await fetchData();
    };

    const updateSavingGoal = async (id: string, updates: Partial<SavingGoal>) => {
        await getUserIdOrThrow();
        const formattedUpdates: any = { ...updates };
        if (updates.targetAmount) formattedUpdates.target_amount = updates.targetAmount;
        if (updates.currentAmount) formattedUpdates.current_amount = updates.currentAmount;

        const { error } = await supabase.from('savings').update(formattedUpdates).eq('id', id);
        if (error) throw error;
        await fetchData();
    };

    const deleteSavingGoal = async (id: string) => {
        await getUserIdOrThrow();
        const { error } = await supabase.from('savings').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
    };

    const addSavingDeposit = async (id: string, amount: number) => {
        const goal = savings.find(s => s.id === id);
        if (!goal) return;
        await updateSavingGoal(id, { currentAmount: goal.currentAmount + amount });
    };

    // Categories
    const addCategory = async (c: Omit<Category, 'id'>) => {
        const uid = await getUserIdOrThrow();
        const { error } = await supabase.from('categories').insert([{
            user_id: uid,
            name: c.name,
            color: c.color,
            subcategories: c.subcategories,
            is_income: c.isIncome
        }]);
        if (error) throw error;
        await fetchData();
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        await getUserIdOrThrow();
        const formattedUpdates: any = { ...updates };
        if (updates.isIncome !== undefined) formattedUpdates.is_income = updates.isIncome;

        const { error } = await supabase.from('categories').update(formattedUpdates).eq('id', id);
        if (error) throw error;
        await fetchData();
    };

    const deleteCategory = async (id: string) => {
        await getUserIdOrThrow();
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUserId(null);
        setUser(null);
        setAccounts([]);
        setTransactions([]);
        setServices([]);
        setSavings([]);
        setCategories([]);
    };

    return (
        <FinanceContext.Provider value={{
            accounts,
            transactions,
            services,
            savings,
            categories,
            isLoading,
            user,
            refreshData: fetchData,
            signOut,
            addTransaction,
            addAccount,
            updateAccount,
            deleteAccount,
            addDeposit,
            addService,
            updateService,
            deleteService,
            addSavingGoal,
            updateSavingGoal,
            deleteSavingGoal,
            addSavingDeposit,
            addCategory,
            updateCategory,
            deleteCategory,
            updateTransaction,
            deleteTransaction
        }}>
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const context = useContext(FinanceContext);
    if (!context) throw new Error("useFinance must be used within FinanceProvider");
    return context;
}
