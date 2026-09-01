import Link from 'next/link';

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'Social Central';
const brandTagline = process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Conteúdo e atendimento do Instagram, num lugar só';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">{brandName}</h1>
        <p className="text-slate-400">{brandTagline}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/content"
          className="group relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-6 transition-all hover:shadow-xl hover:shadow-cyan-500/20"
        >
          <div className="space-y-3">
            <div className="text-3xl">📝</div>
            <h2 className="text-xl font-bold text-white">Conteúdo</h2>
            <p className="text-slate-400 text-sm">
              Crie, aprove e agende posts. Mantenha seu calendário editorial organizado.
            </p>
            <div className="pt-2 text-cyan-400 text-sm font-medium group-hover:gap-2 flex items-center transition-all">
              Gerenciar →
            </div>
          </div>
        </Link>

        <Link
          href="/inbox"
          className="group relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-green-500/50 rounded-lg p-6 transition-all hover:shadow-xl hover:shadow-green-500/20"
        >
          <div className="space-y-3">
            <div className="text-3xl">💬</div>
            <h2 className="text-xl font-bold text-white">Atendimento</h2>
            <p className="text-slate-400 text-sm">
              Automatize respostas com IA ou encaminhe para humano. Nunca perda um lead.
            </p>
            <div className="pt-2 text-green-400 text-sm font-medium group-hover:gap-2 flex items-center transition-all">
              Responder →
            </div>
          </div>
        </Link>

        <Link
          href="/knowledge-base"
          className="group relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-purple-500/50 rounded-lg p-6 transition-all hover:shadow-xl hover:shadow-purple-500/20"
        >
          <div className="space-y-3">
            <div className="text-3xl">📚</div>
            <h2 className="text-xl font-bold text-white">Base de Conhecimento</h2>
            <p className="text-slate-400 text-sm">
              Mantenha perguntas e respostas para treinar a IA de atendimento.
            </p>
            <div className="pt-2 text-purple-400 text-sm font-medium group-hover:gap-2 flex items-center transition-all">
              Editar →
            </div>
          </div>
        </Link>

        <Link
          href="/settings"
          className="group relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-orange-500/50 rounded-lg p-6 transition-all hover:shadow-xl hover:shadow-orange-500/20"
        >
          <div className="space-y-3">
            <div className="text-3xl">⚙️</div>
            <h2 className="text-xl font-bold text-white">Configurações</h2>
            <p className="text-slate-400 text-sm">
              Conecte seus serviços de publicação, atendimento e CRM com segurança.
            </p>
            <div className="pt-2 text-orange-400 text-sm font-medium group-hover:gap-2 flex items-center transition-all">
              Configurar →
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-6">
        <h3 className="text-white font-bold mb-2">ℹ️ Configuração necessária</h3>
        <p className="text-slate-300 text-sm">Antes de usar o sistema:</p>
        <ul className="text-slate-400 text-sm mt-3 space-y-1 ml-4 list-disc">
          <li>Configure API keys no .env (Publora, Zernio, Claude)</li>
          <li>Conecte sua conta do Instagram via Publora</li>
          <li>Configure webhook de Zernio para receber mensagens</li>
          <li>Crie itens na Base de Conhecimento para respostas automáticas</li>
        </ul>
      </div>
    </div>
  );
}
