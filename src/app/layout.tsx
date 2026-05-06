import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "仕様書レビュー・作成支援",
  description: "AIを活用した発注仕様書のレビュー・作成支援アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-slate-950 text-slate-100">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-auto">
            <div className="max-w-5xl mx-auto px-6 py-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
