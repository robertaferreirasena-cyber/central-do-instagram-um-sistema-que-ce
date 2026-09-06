import { NextResponse } from 'next/server';

// GET /api/settings/status
// Reporta se as integrações estão configuradas via env, SEM expor as chaves (só boolean).
export async function GET() {
  const has = (v?: string | null) => Boolean(v && v.trim().length > 0);

  return NextResponse.json({
    success: true,
    publora: has(process.env.PUBLORA_API_KEY),
    zernio: has(process.env.ZERNIO_API_KEY),
    claude: has(process.env.CLAUDE_API_KEY) || has(process.env.ANTHROPIC_API_KEY),
    crm: has(process.env.CRM_API_KEY),
    telegram: has(process.env.TELEGRAM_BOT_TOKEN) && has(process.env.TELEGRAM_CHAT_ID),
  });
}
