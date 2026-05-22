import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { auth0 } from "@/lib/auth0";
import { Plus_Jakarta_Sans } from 'next/font/google'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "Peakd",
  description: "Peakd videographer and media tools",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth0.getSession();

  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className={`min-h-full flex flex-col ${jakarta.className}`}>
        <ThemeProvider>
          <Auth0Provider user={session?.user}>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </Auth0Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
