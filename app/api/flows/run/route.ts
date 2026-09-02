import { NextRequest, NextResponse } from 'next/server';
import {
  getFlow,
  getOrCreateFlowRun,
  executeRun,
  resumeFlowFromButton,
  Flow,
  FlowRun,
} from '@/lib/flowEngine';
import { supabase, dbQuery } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, flowId, igUserId, conversationId, runId, buttonIndex, buttonValue } = body;

    if (action === 'start') {
      // Inicia um novo fluxo
      const flow = await getFlow(flowId);
      if (!flow) {
        return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
      }

      // Cria ou retorna run existente
      const run = await getOrCreateFlowRun(flowId, igUserId, conversationId);
      if (!run) {
        return NextResponse.json({ error: 'Failed to create flow run' }, { status: 500 });
      }

      // Executa o fluxo
      const result = await executeRun(run, flow);

      // Aplica segurança: seta cooldown do agente se flow iniciou
      if (flow.cooldown_minutes && flow.cooldown_minutes > 0) {
        await setAiCooldown(igUserId, conversationId, flow.cooldown_minutes);
      }

      return NextResponse.json({
        runId: result.run.id,
        status: result.run.status,
        actions: result.actions,
        nextStep: result.nextStep,
      });
    } else if (action === 'resume') {
      // Retoma fluxo a partir de um botão clicado
      const result = await resumeFlowFromButton(runId, buttonIndex, buttonValue);
      if (!result) {
        return NextResponse.json({ error: 'Flow run not found' }, { status: 404 });
      }

      return NextResponse.json({
        runId: result.run.id,
        status: result.run.status,
        actions: result.actions,
      });
    } else if (action === 'get_run') {
      // Obtém o status de um run
      const { data: run } = await dbQuery(() =>
        supabase.from('flow_runs').select('*').eq('id', runId).single()
      );

      if (!run) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 });
      }

      return NextResponse.json(run);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Flow run error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function setAiCooldown(
  igUserId: string,
  conversationId: string,
  cooldownMinutes: number
): Promise<void> {
  const cooldownUntil = new Date(Date.now() + cooldownMinutes * 60 * 1000);

  await dbQuery(() =>
    supabase
      .from('zernio_conversations')
      .update({ ai_paused_until: cooldownUntil.toISOString() })
      .eq('ig_user_id', igUserId)
      .eq('conversation_id', conversationId)
  );
}
