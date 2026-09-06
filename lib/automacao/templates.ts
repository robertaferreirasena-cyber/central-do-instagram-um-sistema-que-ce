import { AutomacaoFlow, AutomacaoBlock } from './types';

let _seq = 0;
function generateId() {
  // determinístico dentro do template (evita IDs "fantasma" e facilita referenciar ramos)
  return `b_${Date.now().toString(36)}_${(_seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

// 'comentou-link': comentou LINK → resposta pública → DM com botão → condição ramifica
// (clicou o botão → tag + WhatsApp; não clicou → encerra).
function comentouLink(): AutomacaoFlow {
  const reply: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Te enviei o material no Direct!' };
  const ask: AutomacaoBlock = {
    id: generateId(),
    type: 'quick_replies',
    content: 'Qual material você gostaria?',
    buttons: [{ label: 'Aqui está', postback: 'btn_1', action_type: 'next_block' }],
  };
  const tag: AutomacaoBlock = { id: generateId(), type: 'tag', tag_to_apply: 'criar_lead' };
  const wpp: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Veja mais no nosso WhatsApp: https://wa.me/...' };
  const end: AutomacaoBlock = { id: generateId(), type: 'end_flow' };
  const cond: AutomacaoBlock = {
    id: generateId(),
    type: 'condition',
    condition_field: 'button',
    condition_equals: 'btn_1',
    yes_step: tag.id, // clicou → aplica tag e segue pro WhatsApp
    no_step: end.id, // não clicou → encerra
  };
  return {
    nome: 'Comentou LINK no Reel',
    descricao: 'Fluxo: usuário comenta LINK → resposta pública → DM com material → botão → tag',
    trigger_type: 'comment',
    trigger_value: 'LINK',
    match_mode: 'contains',
    enabled: false,
    blocks: [reply, ask, cond, tag, wpp, end],
  };
}

// 'recuperar-interesse': DM "preço" → pergunta interesse → condição (Sim → WhatsApp; Não → encerra).
function recuperarInteresse(): AutomacaoFlow {
  const ask: AutomacaoBlock = {
    id: generateId(),
    type: 'quick_replies',
    content: 'Encontramos a oferta perfeita para você! Quer saber mais?',
    buttons: [
      { label: 'Sim!', postback: 'yes', action_type: 'next_block' },
      { label: 'Não agora', postback: 'no', action_type: 'next_block' },
    ],
  };
  const wpp: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Ótimo! Chama no WhatsApp: https://wa.me/...' };
  const end: AutomacaoBlock = { id: generateId(), type: 'end_flow' };
  const cond: AutomacaoBlock = {
    id: generateId(),
    type: 'condition',
    condition_field: 'button',
    condition_equals: 'yes',
    yes_step: wpp.id, // clicou "Sim!" → WhatsApp
    no_step: end.id, // clicou "Não agora" → encerra
  };
  return {
    nome: 'Recuperar interesse',
    descricao: 'Fluxo: mensagem "preço" → pergunta interesse → oferta → WhatsApp/encerrar',
    trigger_type: 'dm',
    trigger_value: 'preco',
    match_mode: 'contains',
    enabled: false,
    blocks: [ask, cond, wpp, end],
  };
}

// 'boas-vindas-dm': novo follow → DM de boas-vindas → botões de interesse → tag (sem condição).
function boasVindas(): AutomacaoFlow {
  return {
    nome: 'Boas-vindas no Direct',
    descricao: 'Fluxo: novo follow → DM de boas-vindas → botões de interesse',
    trigger_type: 'dm',
    trigger_value: '',
    match_mode: 'contains',
    enabled: false,
    blocks: [
      { id: generateId(), type: 'text', content: 'Oi! Bem-vindo(a) 👋 Que bom te ver por aqui!' },
      {
        id: generateId(),
        type: 'quick_replies',
        content: 'O que você gostaria de saber?',
        buttons: [
          { label: 'Produtos', postback: 'p1', action_type: 'next_block' },
          { label: 'Ofertas', postback: 'p2', action_type: 'next_block' },
        ],
      },
      { id: generateId(), type: 'tag', tag_to_apply: 'criar_lead' },
      { id: generateId(), type: 'end_flow' },
    ],
  };
}

// ============================================================================
// MODELOS IA CLUB — comunidade de IA aplicada pra empreendedores. Tom direto,
// prático, sem hype. Oferta: anual R$697 (12x R$65) | mensal R$97 | garantia 7 dias.
// Isca: newsletter grátis "Café com AI". Site: https://iaclubcomunidade.com.br/
// Roteiro em cada fluxo: gancho → dor → virada → prova → CTA. Todos coletam ao menos
// 1 dado (alimenta o CRM), aplicam 1 tag e terminam com botão url pro site.
// ============================================================================
const SITE_IA_CLUB = 'https://iaclubcomunidade.com.br/';

// 'captura-email': DM → oferece o Café com AI grátis → coleta e-mail → tag → botão site.
function capturaEmail(): AutomacaoFlow {
  const gancho: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Você já sentiu que a IA passa voando e você não consegue aplicar de verdade no seu negócio? 🤔' };
  const virada: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Toda semana eu mando o Café com AI: 1 ideia prática de IA aplicada pra empreendedor, sem enrolação e de graça, direto no seu e-mail. ☕' };
  const coleta: AutomacaoBlock = { id: generateId(), type: 'collect_data', content: 'Me manda seu melhor e-mail que eu já te coloco na lista.', field_name: 'email' };
  const tag: AutomacaoBlock = { id: generateId(), type: 'tag', tag_to_apply: 'assinante_newsletter' };
  const cta: AutomacaoBlock = {
    id: generateId(),
    type: 'quick_replies',
    content: 'Prontinho! Falta só confirmar. Toca no botão pra garantir sua vaga na comunidade também:',
    buttons: [{ label: 'Assinar grátis', action_type: 'url', url: SITE_IA_CLUB }],
  };
  const end: AutomacaoBlock = { id: generateId(), type: 'end_flow' };
  return {
    nome: 'Captura de e-mail (isca newsletter)',
    descricao: 'DM → oferece o Café com AI grátis → coleta e-mail → tag assinante → botão pro site',
    trigger_type: 'dm',
    trigger_value: 'cafe,newsletter,ai',
    match_mode: 'contains',
    enabled: false,
    blocks: [gancho, virada, coleta, tag, cta, end],
  };
}

// 'comentou-preco': comentário 'preço/valor' → resposta pública → DM qualifica
// (mensal/anual) → coleta nome → tag lead_quente → oferta → botão site.
function comentouPreco(): AutomacaoFlow {
  const reply: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Te chamei no Direct com tudo sobre os valores 👀' };
  const abertura: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Boa! Antes de te passar o valor, deixa eu entender rapidinho o que faz mais sentido pra você.' };
  const coleta: AutomacaoBlock = { id: generateId(), type: 'collect_data', content: 'Perfeito! Como é seu nome, pra eu te enviar os detalhes certinhos?', field_name: 'nome' };
  const escolha: AutomacaoBlock = {
    id: generateId(),
    type: 'quick_replies',
    content: 'Você tá pensando em entrar no plano mensal ou no anual (que sai bem mais em conta)?',
    buttons: [
      { label: 'Mensal', action_type: 'next_block' },
      { label: 'Anual', action_type: 'next_block' },
    ],
  };
  const tag: AutomacaoBlock = { id: generateId(), type: 'tag', tag_to_apply: 'lead_quente' };
  const oferta: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Olha só: anual R$697 (ou 12x de R$65) e mensal R$97. E você tem 7 dias de garantia — se não curtir, devolvo tudo, sem drama.' };
  const cta: AutomacaoBlock = {
    id: generateId(),
    type: 'quick_replies',
    content: 'Quer garantir sua vaga agora e começar a aplicar IA essa semana?',
    buttons: [{ label: 'Quero entrar', action_type: 'url', url: SITE_IA_CLUB }],
  };
  const end: AutomacaoBlock = { id: generateId(), type: 'end_flow' };
  // Os dois botões (mensal/anual) levam ao mesmo próximo passo (a tag/oferta).
  escolha.buttons![0].next = tag.id;
  escolha.buttons![1].next = tag.id;
  return {
    nome: 'Comentou preço → qualifica → oferta',
    descricao: 'Comentário "preço/valor" → resposta pública → DM → mensal/anual → coleta nome → tag → oferta → site',
    trigger_type: 'comment',
    trigger_value: 'preco,preço,valor,valores',
    match_mode: 'contains',
    enabled: false,
    blocks: [reply, abertura, coleta, escolha, tag, oferta, cta, end],
  };
}

// 'story-interesse': resposta de story/DM → pergunta o objetivo → coleta nome → tag → oferta.
function storyInteresse(): AutomacaoFlow {
  const gancho: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Vi que você reagiu ao meu story 🙌 bora fazer isso virar resultado no seu negócio?' };
  const objetivo: AutomacaoBlock = { id: generateId(), type: 'collect_data', content: 'Me conta em uma frase: qual seu maior objetivo com IA hoje? (ex: ganhar tempo, vender mais, criar conteúdo)', field_name: 'objetivo' };
  const nome: AutomacaoBlock = { id: generateId(), type: 'collect_data', content: 'Show! E como você se chama?', field_name: 'nome' };
  const tag: AutomacaoBlock = { id: generateId(), type: 'tag', tag_to_apply: 'interessado_ia' };
  const oferta: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Sacada: no IA Club a gente aplica IA no que VOCÊ já faz — nada de curso parado. Anual R$697 (12x R$65), mensal R$97, 7 dias de garantia total.' };
  const cta: AutomacaoBlock = {
    id: generateId(),
    type: 'quick_replies',
    content: 'Quer dar o primeiro passo agora?',
    buttons: [{ label: 'Quero conhecer', action_type: 'url', url: SITE_IA_CLUB }],
  };
  const end: AutomacaoBlock = { id: generateId(), type: 'end_flow' };
  return {
    nome: 'Story reply → interesse',
    descricao: 'Resposta de story/DM → pergunta o objetivo → coleta nome → tag → oferta → site',
    trigger_type: 'story_reply',
    trigger_value: '',
    match_mode: 'contains',
    enabled: false,
    blocks: [gancho, objetivo, nome, tag, oferta, cta, end],
  };
}

// 'recuperacao-nao-respondeu': reengajamento com oferta + garantia + coleta e-mail + botão.
function recuperacaoNaoRespondeu(): AutomacaoFlow {
  const gancho: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Oi! Vi que você chegou a se interessar pelo IA Club e acabou não entrando 👀' };
  const dor: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Sem pressão — mas enquanto a gente adia, a galera lá dentro já tá aplicando IA e economizando horas toda semana.' };
  const coleta: AutomacaoBlock = { id: generateId(), type: 'collect_data', content: 'Se quiser, deixo seu e-mail salvo e te aviso das novidades + te mando o Café com AI grátis. Qual seu melhor e-mail?', field_name: 'email' };
  const tag: AutomacaoBlock = { id: generateId(), type: 'tag', tag_to_apply: 'lead_recuperacao' };
  const oferta: AutomacaoBlock = { id: generateId(), type: 'text', content: 'Relembrando a oferta: anual R$697 (12x R$65), mensal R$97, e 7 dias de garantia total. Risco zero pra você testar.' };
  const cta: AutomacaoBlock = {
    id: generateId(),
    type: 'quick_replies',
    content: 'Bora recomeçar? Toca aqui e garante sua vaga:',
    buttons: [{ label: 'Quero voltar', action_type: 'url', url: SITE_IA_CLUB }],
  };
  const end: AutomacaoBlock = { id: generateId(), type: 'end_flow' };
  return {
    nome: 'Recuperação (não respondeu)',
    descricao: 'Reengajamento → dor → coleta e-mail → tag → oferta com garantia → botão pro site',
    trigger_type: 'dm',
    trigger_value: '',
    match_mode: 'contains',
    enabled: false,
    blocks: [gancho, dor, coleta, tag, oferta, cta, end],
  };
}

export function getTemplate(templateKey: string): AutomacaoFlow | null {
  switch (templateKey) {
    case 'comentou-link':
      return comentouLink();
    case 'boas-vindas-dm':
      return boasVindas();
    case 'recuperar-interesse':
      return recuperarInteresse();
    case 'captura-email':
      return capturaEmail();
    case 'comentou-preco':
      return comentouPreco();
    case 'story-interesse':
      return storyInteresse();
    case 'recuperacao-nao-respondeu':
      return recuperacaoNaoRespondeu();
    default:
      return null;
  }
}

export function listTemplates() {
  return [
    { key: 'comentou-link', nome: 'Comentou LINK no Reel', descricao: 'Comentário com LINK → DM + botão → tag' },
    { key: 'boas-vindas-dm', nome: 'Boas-vindas no Direct', descricao: 'Novo follow → DM de boas-vindas' },
    { key: 'recuperar-interesse', nome: 'Recuperar interesse', descricao: 'Mensagem "preço" → oferta → WhatsApp' },
    { key: 'captura-email', nome: 'Captura de e-mail (isca newsletter)', descricao: 'DM → Café com AI grátis → coleta e-mail → tag → site' },
    { key: 'comentou-preco', nome: 'Comentou preço → qualifica → oferta', descricao: 'Comentário "preço" → qualifica → coleta nome → tag → oferta' },
    { key: 'story-interesse', nome: 'Story reply → interesse', descricao: 'Story → objetivo → coleta nome → tag → oferta' },
    { key: 'recuperacao-nao-respondeu', nome: 'Recuperação (não respondeu)', descricao: 'Reengajamento → coleta e-mail → tag → oferta + garantia' },
  ];
}
