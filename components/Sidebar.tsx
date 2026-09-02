'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Archivo, JetBrains_Mono } from 'next/font/google';

const archivo = Archivo({ subsets: ['latin'], weight: ['600', '800', '900'] });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'] });

interface SidebarProps {
  brandName: string;
}

export function Sidebar({ brandName }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/visao-geral', label: 'Visão geral', icon: '📊' },
    { href: '/conteudo', label: 'Conteúdo', icon: '✍️' },
    { href: '/calendario', label: 'Calendário', icon: '📅' },
    { href: '/publicacoes', label: 'Publicações', icon: '📱' },
    { href: '/automacao', label: 'Automação', icon: '⚙️' },
    { href: '/inbox', label: 'Inbox', icon: '💬' },
    { href: '/analise', label: 'Análise', icon: '📈' },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      <style>{`
        @media (max-width: 899px) {
          aside {
            transform: translateX(${isOpen ? '0' : '-280px'});
            transition: transform 300ms ease;
            z-index: 50;
          }
          .sidebar-backdrop {
            display: ${isOpen ? 'block' : 'none'};
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 40;
          }
        }
        @media (min-width: 900px) {
          .sidebar-toggle {
            display: none;
          }
          .sidebar-backdrop {
            display: none !important;
          }
        }
      `}</style>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 60,
          backgroundColor: '#0E2A2E',
          color: '#FAFAF8',
          border: '1px solid #1A3A40',
          padding: '0.5rem',
          cursor: 'pointer',
          fontSize: '1.25rem',
          display: 'none',
        }}
      >
        ☰
      </button>
    <aside
      style={{
        width: '280px',
        backgroundColor: '#0E2A2E',
        color: '#FAFAF8',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        overflowY: 'auto',
        borderRight: '1px solid #1A3A40',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #1A3A40' }}>
        <Link
          href="/visao-geral"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: '#FAFAF8',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: archivo.style.fontFamily,
              fontWeight: 900,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            <span>IA CLUB</span>
            <div style={{ width: '6px', height: '20px', backgroundColor: '#D6F24B' }} />
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0' }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                color: active ? '#FAFAF8' : '#A8BDB5',
                textDecoration: 'none',
                position: 'relative',
                transition: 'color 200ms ease',
                fontFamily: jetBrainsMono.style.fontFamily,
                fontSize: '0.875rem',
                fontWeight: 500,
                borderLeft: active ? '3px solid #D6F24B' : 'none',
                paddingLeft: active ? 'calc(1rem - 3px)' : '1rem',
                backgroundColor: active ? 'rgba(214, 242, 75, 0.1)' : 'transparent',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Workspace Selector */}
      <div style={{ padding: '1rem', borderTop: '1px solid #1A3A40' }}>
        <button
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0',
            color: '#FAFAF8',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: jetBrainsMono.style.fontFamily,
            fontSize: '0.75rem',
            fontWeight: 500,
            transition: 'background-color 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '9999px',
              backgroundColor: '#D6F24B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0E2A2E',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            IA
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FAFAF8' }}>IA CLUB</div>
            <div style={{ fontSize: '0.65rem', color: '#A8BDB5', marginTop: '2px' }}>Equipe</div>
          </div>
        </button>
      </div>
    </aside>
    </>
  );
}
