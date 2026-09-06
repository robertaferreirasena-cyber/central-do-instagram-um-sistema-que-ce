'use client';
import { AnalyticsTab } from '@/components/AnalyticsTab';

// Seção focada: só Analytics.
export default function AnalyticsPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: 1280, margin: '0 auto' }}>
      <AnalyticsTab />
    </div>
  );
}
