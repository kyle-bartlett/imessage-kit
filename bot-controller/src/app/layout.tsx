import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Kyle Bot Controller",
  description: "Control your personal iMessage AI assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-950 text-white min-h-screen font-sans">
        <div className="flex flex-col md:flex-row min-h-screen">
          <Navigation />
          <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
