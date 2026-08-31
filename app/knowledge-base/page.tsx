'use client';

import { FormEvent, useState } from 'react';

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'geral',
    question: '',
    answer: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          account_id: 'default-account',
          created_by: 'roberta',
        }),
      });

      if (response.ok) {
        setItems([...items, { id: Date.now(), ...formData }]);
        setFormData({ category: 'geral', question: '', answer: '' });
        setShowForm(false);
      }
    } catch (err) {
      console.error('Erro ao criar item:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Base de Conhecimento</h1>
          <p className="text-slate-400 mt-1">Perguntas e respostas para IA de atendimento</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Adicionar Q&A
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-500 outline-none"
            >
              <option>geral</option>
              <option>preço</option>
              <option>como-funciona</option>
              <option>tiktok-shop</option>
              <option>suporte</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Pergunta</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Ex: Qual é o preço do seu serviço?"
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Resposta</label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Escreva a resposta..."
              rows={4}
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-purple-500 outline-none resize-none"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Salvando...' : 'Adicionar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {items.length === 0 && !showForm ? (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-bold text-white mb-2">Base vazia</h2>
          <p className="text-slate-400 mb-6">
            Adicione perguntas frequentes para treinar a IA de atendimento automático
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Adicionar primeiro Q&A
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="font-bold text-white">{item.question}</h3>
              <p className="text-slate-400 text-sm mt-2">{item.answer}</p>
              <div className="text-xs text-slate-500 mt-2">Categoria: {item.category}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
