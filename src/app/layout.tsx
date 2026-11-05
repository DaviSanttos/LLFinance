import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "LLFinance — Sistema Contábil Educacional",
  description:
    "Sistema de contabilidade com partida dobrada, Diário, Razão, Balancete, Balanço e DRE. Etapa 1 com dados demonstrativos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
