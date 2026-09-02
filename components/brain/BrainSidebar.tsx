'use client';

import { ReactNode } from 'react';

interface BrainSidebarProps {
  sections: Array<{ key: string; label: string }>;
  activeSection: string;
  onSelectSection: (key: any) => void;
}

export default function BrainSidebar({
  sections,
  activeSection,
  onSelectSection,
}: BrainSidebarProps) {
  return (
    <div className="w-56 flex-shrink-0">
      <div className="bg-[#0E2A2E] rounded border border-[#1a3f45] p-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-[#3ddc84] mb-4">
          Seções
        </h3>

        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => onSelectSection(section.key as any)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                activeSection === section.key
                  ? 'bg-[#3ddc84]/20 text-[#3ddc84] border-l-2 border-[#3ddc84]'
                  : 'text-[#a0b0c7] hover:bg-[#1a3f45]'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4 bg-[#0E2A2E] rounded border border-[#1a3f45] p-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-[#3ddc84] mb-3">
          Inteligência
        </h3>

        <div className="space-y-2 text-sm text-[#a0b0c7]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#3ddc84] rounded-full" />
            Assistente de conteúdo
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#29b6ff] rounded-full" />
            Agente de Direct
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FFD700] rounded-full" />
            Brain System
          </div>
        </div>
      </div>
    </div>
  );
}
