import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patan — Catan Board",
  description: "Custom Catan board game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-full w-full m-0 p-0">{children}</body>
    </html>
  );
}
