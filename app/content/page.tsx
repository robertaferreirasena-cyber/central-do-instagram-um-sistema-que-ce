'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContentPage() {
  const [briefs, setBriefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Conteúdo</h1>
          <p className="text-slate-400 mt-1">Crie e aprove posts para Instagram</p>
        </div>
        <Link
          href="/content/create"
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Novo Brief
        </Link>
      </div>

      {briefs.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-bold text-white mb-2">Nenhum brief criado</h2>
          <p className="text-slate-400 mb-6">
            Comece criando um novo brief para seu próximo post
          </p>
          <Link
            href="/content/create"
            className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Criar primeiro brief
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief: any) => (
            <div
              key={brief.id}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-white">{brief.theme}</h3>
                  <p className="text-slate-400 text-sm mt-1">{brief.caption.substring(0, 100)}...</p>
                </div>
                <span className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded">
                  {brief.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
