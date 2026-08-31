'use client';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 mt-1">Configure suas integrações de API</p>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">🔑 Publora</h2>
          <p className="text-slate-400 text-sm mb-4">
            Publora publica seus posts no Instagram. Configure via <code className="bg-black/30 px-2 py-1 rounded">.env</code>
          </p>
          <div className="space-y-3">
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              PUBLORA_API_KEY=pk_...
            </div>
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              PUBLORA_BASE_URL=https://api.publora.com
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Status: <span className="text-red-400">❌ Não configurado</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">💬 Zernio</h2>
          <p className="text-slate-400 text-sm mb-4">
            Zernio gerencia inbox e automação de atendimento. Configure via <code className="bg-black/30 px-2 py-1 rounded">.env</code>
          </p>
          <div className="space-y-3">
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              ZERNIO_API_KEY=sk_...
            </div>
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              ZERNIO_BASE_URL=https://zernio.com/api/v1
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Status: <span className="text-red-400">❌ Não configurado</span>
          </p>
          <p className="text-slate-400 text-xs mt-3">
            Webhook URL para Zernio: <code className="bg-black/30 px-2 py-1 rounded">https://seu-dominio.com/api/webhook/zernio</code>
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">🤖 Claude API</h2>
          <p className="text-slate-400 text-sm mb-4">
            Claude gera conteúdo e respostas automáticas. Configure via <code className="bg-black/30 px-2 py-1 rounded">.env</code>
          </p>
          <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
            CLAUDE_API_KEY=sk-ant-...
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Status: <span className="text-red-400">❌ Não configurado</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">📱 ChimaGi CRM</h2>
          <p className="text-slate-400 text-sm mb-4">
            Integração com seu CRM para capturar leads. Configure via <code className="bg-black/30 px-2 py-1 rounded">.env</code>
          </p>
          <div className="space-y-3">
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              CHIMAGI_API_URL=http://localhost:3001
            </div>
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              CHIMAGI_API_KEY=your-key-here
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Status: <span className="text-red-400">❌ Não configurado</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">💌 Telegram</h2>
          <p className="text-slate-400 text-sm mb-4">
            Notificações de handoff para você. Configure via <code className="bg-black/30 px-2 py-1 rounded">.env</code>
          </p>
          <div className="space-y-3">
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              TELEGRAM_BOT_TOKEN=123456789:ABCdef...
            </div>
            <div className="bg-black/30 rounded p-3 font-mono text-sm text-slate-300">
              TELEGRAM_CHAT_ID=your-chat-id
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Status: <span className="text-red-400">❌ Não configurado</span>
          </p>
        </div>
      </div>

      <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-6">
        <h3 className="text-white font-bold mb-2">📝 Próximos passos</h3>
        <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
          <li>Copie as chaves de API de cada plataforma</li>
          <li>Abra o arquivo <code className="bg-black/30 px-2 py-1 rounded text-xs">.env.local</code> na raiz do projeto</li>
          <li>Preencha as variáveis conforme o .env.example</li>
          <li>Reinicie o servidor <code className="bg-black/30 px-2 py-1 rounded text-xs">npm run dev</code></li>
          <li>Configure o webhook de Zernio em seu dashboard</li>
        </ol>
      </div>
    </div>
  );
}
