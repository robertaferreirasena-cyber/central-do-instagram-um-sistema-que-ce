import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { claude } from '@/lib/claude';
import { zernio } from '@/lib/zernio';
import { chimagi } from '@/lib/chimagi';
import { telegram } from '@/lib/telegram';
import { InteractionStatus, ApiResponse } from '@/types';

// POST - Webhook de Zernio (DM/comentário)
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    // Validar webhook (implementar assinatura HMAC se Zernio exigir)
    // Por enquanto, apenas logar e processar

    const { interaction_type, sender_username, content, platform, conversation_id, message_id } = event;

    if (!sender_username || !content) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios faltando' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // 1. Buscar account
    const { data: account } = await supabase
      .from('instagram_accounts')
      .select('id, zernio_profile_id')
      .eq('zernio_profile_id', event.profile_id)
      .single();

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Conta não encontrada' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // 2. Verificar se evento já foi processado (external_event_id único)
    const { data: existing } = await supabase
      .from('instagram_interactions')
      .select('id')
      .eq('external_event_id', message_id)
      .eq('account_id', account.id)
      .single();

    if (existing) {
      // Evento já processado, retornar ok
      return NextResponse.json({ success: true, data: { duplicate: true } } as ApiResponse<any>);
    }

    // 3. Buscar base de conhecimento
    const { data: knowledgeBase } = await supabase
      .from('base_conhecimento')
      .select('id, question, answer, confidence_threshold')
      .eq('account_id', account.id)
      .eq('active', true);

    // 4. Gerar resposta via Claude
    const kbText = knowledgeBase?.map((k: any) => `P: ${k.question}\nR: ${k.answer}`).join('\n\n') || 'Base vazia';

    const genResult = await claude.generateResponse({
      interaction_content: content,
      knowledge_base: kbText,
    });

    let autoResponse = '';
    let shouldForward = false;
    let baseKbId: string | null = null;
    let confidence = 0;

    if (genResult.data) {
      autoResponse = genResult.data.response;
      shouldForward = genResult.data.should_forward_to_human;
      confidence = genResult.data.confidence;

      // Encontrar qual item da base foi usado (simplificado)
      if (!shouldForward && knowledgeBase) {
        const matchedKb = knowledgeBase.find((k: any) => k.answer.toLowerCase().includes(autoResponse.toLowerCase().substring(0, 20)));
        if (matchedKb) {
          baseKbId = matchedKb.id;
        }
      }
    }

    // 5. Criar interação
    const interactionStatus = shouldForward ? InteractionStatus.PENDING_HUMAN : InteractionStatus.AUTO_RESPONDED;

    const { data: interaction, error: interactionError } = await supabase
      .from('instagram_interactions')
      .insert([
        {
          account_id: account.id,
          external_event_id: message_id,
          sender_username,
          interaction_type: interaction_type || 'dm',
          content,
          status: interactionStatus,
          auto_response: autoResponse || null,
          base_conhecimento_id: baseKbId,
          confidence_score: confidence,
          zernio_message_id: message_id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
      .select()
      .single();

    if (interactionError) {
      console.error('Erro ao criar interação:', interactionError);
      return NextResponse.json(
        { success: false, error: interactionError.message } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // 6. Se confiança alta, responder automaticamente via Zernio
    if (!shouldForward && autoResponse) {
      const sendResult = await zernio.sendMessage({
        conversation_id: conversation_id || '',
        content: autoResponse,
        platform: platform || 'instagram',
      });

      if (sendResult.error) {
        console.error('Erro ao enviar resposta:', sendResult.error);
      }
    }

    // 7. Se precisa de humano, notificar Roberta e marcar para handoff
    if (shouldForward) {
      await supabase
        .from('instagram_interactions')
        .update({ assigned_to: 'roberta' })
        .eq('id', interaction.id);

      await telegram.notifyHandoff({
        sender_username,
        message: content,
        interaction_id: interaction.id,
        assigned_to: 'Roberta',
      });
    }

    // 8. Detectar interesse de compra e criar lead
    if (content.toLowerCase().includes('preço') || content.toLowerCase().includes('compra') || content.toLowerCase().includes('quanto custa')) {
      const leadResult = await chimagi.createOrUpdateLead({
        name: sender_username,
        instagram: sender_username,
        source: 'instagram_dm',
        notes: `Interação ID: ${interaction.id}\nMensagem: ${content}`,
      });

      if (leadResult.data && !leadResult.data.duplicated) {
        await supabase
          .from('instagram_interactions')
          .update({ chimagi_lead_id: leadResult.data.id })
          .eq('id', interaction.id);

        await chimagi.addConversationHistory(leadResult.data.id, content, 'lead');
      }
    }

    return NextResponse.json({ success: true, data: { created: true } } as ApiResponse<any>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook error:', message);
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status: 500 });
  }
}
