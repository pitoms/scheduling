import { ThemeSwitcher } from "@/components/theme-switcher";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import UserSelector from "@/components/user-selector";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";

import { createClient } from "@/utils/supabase/server";
import { getSelectedUser, getUserDetails } from "./actions/userActions";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Stepful Scheduler",
  description: "Finding a time for coaches and students to meet",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const selectedUserId = await getSelectedUser();
  const userDetails = selectedUserId
    ? await getUserDetails(selectedUserId)
    : null;

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
              <div className="w-full max-w-5xl flex justify-between items-center px-4">
                <div className="flex items-center gap-5 font-semibold">
                  <Link href={"/"}>Stepful Scheduler</Link>
                </div>
                <UserSelector />
              </div>
            </nav>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
              <div className="mb-6 text-sm text-muted-foreground">
                Logged in as: {userDetails?.email}
              </div>
              {children}
            </main>

            <footer className="border-t">
              <div className="w-full max-w-5xl mx-auto px-4 py-6 flex justify-center">
                <ThemeSwitcher />
              </div>
            </footer>
          </div>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
