import type { Metadata } from 'next';
import { Archivo, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';

const archivo = Archivo({ subsets: ['latin'], weight: ['600', '800', '900'] });
const instrumentSans = Instrument_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'] });

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'IA Club';
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect fill='%230E2A2E' width='32' height='32'/><rect x='8' y='6' width='4' height='20' fill='%23FAFAF8'/><rect x='16' y='8' width='8' height='18' fill='%23D6F24B'/></svg>" />
      </head>
      <body className={instrumentSans.className} style={{ backgroundColor: '#0E2A2E', color: '#0E2A2E', margin: 0, padding: 0 }}>
        <style>{`
          @media (min-width: 1024px) {
            body > div {
              display: flex;
            }
            [data-role="content"] {
              margin-left: 280px;
              flex: 1;
            }
          }
          @media (max-width: 1023px) {
            [data-role="content"] {
              margin-left: 0;
              padding-top: 3.5rem;
            }
          }
        `}</style>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Sidebar brandName={brandName} />
          <div data-role="content" style={{ backgroundColor: '#FAFAF8', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
