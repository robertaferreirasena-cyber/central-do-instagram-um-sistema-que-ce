'use client';

import { useState } from 'react';

export default function InboxPage() {
  const [interactions, setInteractions] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Atendimento</h1>
        <p className="text-slate-400 mt-1">Gerencie mensagens do Instagram</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="text-2xl text-cyan-400 font-bold">0</div>
          <div className="text-slate-400 text-sm">Novas mensagens</div>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="text-2xl text-green-400 font-bold">0</div>
          <div className="text-slate-400 text-sm">Auto respondidas</div>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="text-2xl text-orange-400 font-bold">0</div>
          <div className="text-slate-400 text-sm">Aguardando você</div>
        </div>
      </div>

      {interactions.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-12 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma mensagem</h2>
          <p className="text-slate-400">
            Quando receber mensagens no Instagram, elas aparecerão aqui. Configure o webhook de Zernio para ativar o atendimento automático.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {interactions.map((interaction: any) => (
            <div
              key={interaction.id}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-white">{interaction.sender_username}</h3>
                  <p className="text-slate-400 text-sm mt-1">{interaction.content}</p>
                </div>
                <span className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded">
                  {interaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
