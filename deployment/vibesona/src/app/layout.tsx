import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuroraBackground } from "@/components/Aurora";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavBar } from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vibesona - AI-Powered Music Studio",
  description: "Your AI-Powered Music Studio for playlist analysis, professional audio editing, and song submissions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <AuroraBackground />
          <NavBar />
          <main className="min-h-[calc(100dvh-56px)]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
