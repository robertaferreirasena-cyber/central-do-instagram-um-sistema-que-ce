import { JetBrains_Mono, Archivo } from 'next/font/google';

const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'] });
const archivo = Archivo({ subsets: ['latin'], weight: ['600', '800', '900'] });

interface PageHeaderProps {
  tag?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ tag, title, subtitle, actions }: PageHeaderProps) {
  return (
    <>
      <style>{`
        .page-header {
          border-bottom: 1px solid #E2E2DE;
          background-color: #FAFAF8;
          padding-bottom: clamp(1.5rem, 4vw, 2rem);
          width: 100%;
        }
        .page-header-content {
          padding: clamp(1.5rem, 4vw, 2rem);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: clamp(1.5rem, 4vw, 2rem);
          flex-wrap: wrap;
        }
        .page-header-title {
          font-family: ${archivo.style.fontFamily};
          font-size: clamp(1.5rem, 4vw, 2.25rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          margin: 0;
          color: #0E2A2E;
        }
        .page-header-subtitle {
          margin-top: 0.5rem;
          font-size: clamp(0.85rem, 2vw, 0.95rem);
          color: #7A8B84;
          margin: 0;
        }
        .page-header-tag {
          font-family: ${jetBrainsMono.style.fontFamily};
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #7A8B84;
          margin-bottom: 0.5rem;
        }
        .page-header-actions {
          display: flex;
          gap: clamp(0.75rem, 2vw, 1rem);
          align-items: center;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .page-header-content {
            flex-direction: column;
          }
          .page-header-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
      <div className="page-header">
        <div className="page-header-content">
          <div style={{ flex: 1, minWidth: 0 }}>
            {tag && (
              <div className="page-header-tag">
                {tag}
              </div>
            )}
            <h1 className="page-header-title">
              {title}
            </h1>
            {subtitle && (
              <p className="page-header-subtitle">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="page-header-actions">
              {actions}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
