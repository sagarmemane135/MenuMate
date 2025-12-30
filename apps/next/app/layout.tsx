import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider, CartProvider } from "@menumate/app";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MenuMate - Restaurant Management",
  description: "Phygital restaurant management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


