import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BeautyClinic",
  description: "ورود و داشبورد BeautyClinic",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-muted">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
