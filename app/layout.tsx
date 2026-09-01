import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'Social Central';
const brandTagline = process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Conteúdo e atendimento do Instagram, num lugar só';

export const metadata: Metadata = {
  title: brandName,
  description: brandTagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">📱</span>
                  </div>
                  <span className="font-bold text-lg text-white">{brandName}</span>
                </Link>

                <div className="flex gap-6">
                  <Link
                    href="/content"
                    className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                  >
                    📝 Conteúdo
                  </Link>
                  <Link
                    href="/inbox"
                    className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                  >
                    💬 Atendimento
                  </Link>
                  <Link
                    href="/knowledge-base"
                    className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                  >
                    📚 Base
                  </Link>
                  <Link
                    href="/settings"
                    className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                  >
                    ⚙️ Config
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          <footer className="border-t border-slate-700 bg-slate-900/50 mt-16 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
              <p>{brandName}</p>
              <p className="mt-2 text-xs">⚠️ Algumas integrações requerem API keys no .env</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
