"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Sidebar } from "@/components/Sidebar";
import { FinanceProvider } from "@/context/FinanceContext";
import { Inter } from "next/font/google";
import { Loader2 } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useFinance();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/auth") {
      router.push("/auth");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // If we're on the auth page, we don't need the sidebar or layout
  if (pathname === "/auth") {
    return <>{children}</>;
  }

  // If we don't have a user and we're not on auth, we're being redirected
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen antialiased bg-gray-50`}>
        <FinanceProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </FinanceProvider>
      </body>
    </html>
  );
}
