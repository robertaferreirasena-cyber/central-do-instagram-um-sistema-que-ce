'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TENANT_TEXT } from '@/lib/tenant';

type ViewMode = 'mes' | 'semana';

export default function CalendarioPage() {
  const [briefs, setBriefs] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('mes');

  useEffect(() => {
    loadBriefs();
  }, []);

  const loadBriefs = async () => {
    try {
      const res = await fetch(`/api/content/briefs?account_id=${TENANT_TEXT}`);
      if (res.ok) {
        const data = await res.json();
        setBriefs(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const getColorByType = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'carrossel':
        return { bg: '#E6F5D6', text: '#2D7A1F', border: '#B8E6A0' };
      case 'reel':
        return { bg: '#F0E6F5', text: '#6B2D7A', border: '#D9B8E6' };
      case 'post':
        return { bg: '#E6EDF5', text: '#2D4D7A', border: '#B8CDE6' };
      case 'story':
        return { bg: '#F5EDE6', text: '#7A5B2D', border: '#E6CDB8' };
      default:
        return { bg: '#F0F0F0', text: '#7A8B84', border: '#E2E2DE' };
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getBriefsByDate = (year: number, month: number, day: number) => {
    return briefs.filter((b) => {
      if (!b.scheduled_at) return false;
      const briefDate = new Date(b.scheduled_at);
      return (
        briefDate.getFullYear() === year &&
        briefDate.getMonth() === month &&
        briefDate.getDate() === day
      );
    });
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Renderizar grade de mês
  const renderMonthCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Adicionar dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {/* Cabeçalho de dias da semana */}
        {dayNames.map((dayName) => (
          <div key={dayName} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#7A8B84', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.5rem 0' }}>
            {dayName}
          </div>
        ))}

        {/* Dias */}
        {days.map((day, idx) => {
          const dayBriefs = day ? getBriefsByDate(currentDate.getFullYear(), currentDate.getMonth(), day) : [];
          const isTodayFlag = day ? isToday(currentDate.getFullYear(), currentDate.getMonth(), day) : false;

          return (
            <div
              key={idx}
              style={{
                backgroundColor: '#FFFFFF',
                border: isTodayFlag ? '2px solid #D6F24B' : '1px solid #E2E2DE',
                padding: '0.75rem',
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isTodayFlag ? '#D6F24B' : '#0E2A2E',
                    backgroundColor: isTodayFlag ? 'transparent' : 'transparent',
                  }}
                >
                  {day || ''}
                </span>
              </div>

              {day ? (
                dayBriefs.length === 0 ? (
                  <div style={{ fontSize: '0.65rem', color: '#7A8B84', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ margin: 0 }}>Nenhuma publicação</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    {dayBriefs.map((brief) => {
                      const colors = getColorByType(brief.type);
                      return (
                        <div
                          key={brief.id}
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            padding: '0.25rem 0.375rem',
                            borderRadius: '0',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            border: `1px solid ${colors.border}`,
                          }}
                          title={brief.theme}
                        >
                          {brief.theme}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  // Painel direito: Fila de publicação
  const fila = briefs
    .filter((b) => b.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  return (
    <>
      <PageHeader
        tag="PLANEJAMENTO"
        title="Calendário editorial"
        subtitle="Planeje a semana antes de precisar improvisar."
        actions={
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={handleToday}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#0E2A2E',
                border: '1px solid #E2E2DE',
                padding: '0.5rem 1rem',
                borderRadius: '0',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8F8F8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
            >
              Hoje
            </button>
            <button
              onClick={handlePrevMonth}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#0E2A2E',
                padding: '0',
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', minWidth: '150px', textAlign: 'center' }}>
              {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextMonth}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#0E2A2E',
                padding: '0',
              }}
            >
              ›
            </button>
            <button
              style={{
                backgroundColor: '#D6F24B',
                color: '#0E2A2E',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#C5E63A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#D6F24B'; }}
            >
              Nova publicação
            </button>
          </div>
        }
      />

      <main style={{ padding: '2rem', flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', width: '100%' }}>
        {/* ÁREA PRINCIPAL: Calendário */}
        <div>
          {/* Toggle Mês/Semana */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            {(['mes', 'semana'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: viewMode === mode ? '#0E2A2E' : '#FFFFFF',
                  color: viewMode === mode ? '#FAFAF8' : '#0E2A2E',
                  border: '1px solid #E2E2DE',
                  borderRadius: '0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                {mode === 'mes' ? 'Mês' : 'Semana editorial'}
              </button>
            ))}
          </div>

          {/* Conteúdo do calendário */}
          {renderMonthCalendar()}
        </div>

        {/* COLUNA DIREITA: Fila de Publicação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content', maxHeight: 'calc(100vh - 200px)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#7A8B84', letterSpacing: '0.1em' }}>
                Fila de publicação
              </p>
            </div>

            {/* Filtro de marca */}
            <select
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #E2E2DE',
                backgroundColor: '#FFFFFF',
                borderRadius: '0',
                fontSize: '0.75rem',
                fontFamily: 'inherit',
                marginBottom: '1rem',
              }}
            >
              <option>Todas as marcas</option>
            </select>
          </div>

          {/* Cards da fila */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto', flex: 1 }}>
            {fila.length === 0 ? (
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '2rem', textAlign: 'center', color: '#7A8B84' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhuma publicação na fila</p>
              </div>
            ) : (
              fila.map((brief) => {
                const colors = getColorByType(brief.type);
                const statusBg = brief.status === 'draft' ? '#F0F0F0' : brief.status === 'revision' ? '#FFF4E6' : '#E6F5D6';
                const statusColor = brief.status === 'draft' ? '#7A8B84' : brief.status === 'revision' ? '#7A5B2D' : '#2D7A1F';
                const statusLabel = brief.status === 'draft' ? 'Rascunho' : brief.status === 'revision' ? 'Em revisão' : 'Agendada';

                return (
                  <div key={brief.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E2DE', padding: '1rem', display: 'flex', gap: '0.75rem' }}>
                    {/* Thumbnail placeholder */}
                    <div style={{ width: '60px', height: '60px', backgroundColor: '#E8E8E4', borderRadius: '0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#7A8B84' }}>
                      Thumb
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#0E2A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {brief.theme}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.65rem', flexWrap: 'wrap' }}>
                        <span style={{ backgroundColor: statusBg, color: statusColor, padding: '0.125rem 0.375rem', fontWeight: 600 }}>
                          {statusLabel}
                        </span>
                        <span style={{ ...colors, padding: '0.125rem 0.375rem', fontWeight: 600, backgroundColor: colors.bg, color: colors.text }}>
                          {brief.type}
                        </span>
                      </div>
                      {brief.scheduled_at && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.65rem', color: '#7A8B84' }}>
                          {new Date(brief.scheduled_at).toLocaleString('pt-BR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {fila.length > 0 && (
            <a
              href="#"
              style={{
                textAlign: 'center',
                color: '#D6F24B',
                textDecoration: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginTop: 'auto',
                paddingTop: '1rem',
                borderTop: '1px solid #E2E2DE',
              }}
            >
              Ver todas na fila →
            </a>
          )}
        </div>
      </main>
    </>
  );
}
