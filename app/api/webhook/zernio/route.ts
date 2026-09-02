import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { claude } from '@/lib/claude';
import { zernio } from '@/lib/zernio';
import { crm } from '@/lib/chimagi';
import { telegram } from '@/lib/telegram';
import { InteractionStatus, ApiResponse } from '@/types';

// POST - Webhook de Zernio (DM/comentário)
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    // Payload Zernio real:
    // { conversation_id, message_id, sender_username, content, platform, profile_id, created_at }
    const { conversation_id, message_id, sender_username, content, platform, profile_id, created_at } = event;

    if (!sender_username || !content || !message_id) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios faltando' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // 1. Buscar account pela profile_id do Zernio
    const { data: account } = await supabase
      .from('instagram_accounts')
      .select('id, zernio_profile_id')
      .eq('zernio_profile_id', profile_id)
      .single();

    if (!account) {
      console.warn(`Account não encontrada para profile_id: ${profile_id}`);
      return NextResponse.json(
        { success: true, data: { skipped: true, reason: 'account_not_found' } } as ApiResponse<any>
      );
    }

    // 2. Dedupe por external_event_id (message_id único do Zernio)
    const { data: existing } = await supabase
      .from('instagram_interactions')
      .select('id')
      .eq('external_event_id', message_id)
      .eq('account_id', account.id)
      .maybeSingle();

    if (existing) {
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

      if (!shouldForward && knowledgeBase) {
        const matchedKb = knowledgeBase.find((k: any) => k.answer.toLowerCase().includes(autoResponse.toLowerCase().substring(0, 20)));
        if (matchedKb) {
          baseKbId = matchedKb.id;
        }
      }
    }

    // 5. Criar interação com dedupe
    const interactionStatus = shouldForward ? InteractionStatus.PENDING_HUMAN : InteractionStatus.AUTO_RESPONDED;

    const { data: interaction, error: interactionError } = await supabase
      .from('instagram_interactions')
      .insert([
        {
          account_id: account.id,
          external_event_id: message_id,
          sender_username,
          interaction_type: 'dm',
          content,
          status: interactionStatus,
          auto_response: autoResponse || null,
          base_conhecimento_id: baseKbId,
          confidence_score: confidence,
          zernio_message_id: message_id,
          platform: platform || 'instagram',
          created_at: created_at ? new Date(created_at) : new Date(),
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
      const sendResult = await zernio.sendMessage(conversation_id, autoResponse);

      if (sendResult.error) {
        console.error('Erro ao enviar resposta:', sendResult.error);
      }
    }

    // 7. Se precisa de humano, notificar atendente
    if (shouldForward) {
      await supabase
        .from('instagram_interactions')
        .update({ assigned_to: 'atendente' })
        .eq('id', interaction.id);

      await telegram.notifyHandoff({
        sender_username,
        message: content,
        interaction_id: interaction.id,
        assigned_to: 'Atendente',
      });
    }

    // 8. Detectar interesse de compra e criar lead
    if (content.toLowerCase().includes('preço') || content.toLowerCase().includes('compra') || content.toLowerCase().includes('quanto custa')) {
      const leadResult = await crm.createOrUpdateLead({
        name: sender_username,
        instagram: sender_username,
        source: 'instagram_dm',
        notes: `Interação ID: ${interaction.id}\nMensagem: ${content}`,
      });

      if (leadResult.data && !leadResult.data.duplicated) {
        await supabase
          .from('instagram_interactions')
          .update({ crm_lead_id: leadResult.data.id })
          .eq('id', interaction.id);

        await crm.addConversationHistory(leadResult.data.id, content, 'lead');
      }
    }

    return NextResponse.json({ success: true, data: { created: true, interaction_id: interaction.id } } as ApiResponse<any>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook error:', message);
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status: 500 });
  }
}
