# Arquitetura — Central IA Club

App Next.js 16 (App Router, `--no-src-dir`) + Supabase + IA NVIDIA. Organizado por
**domínio de negócio** (regra de arquitetura modular do JARVIS): cada domínio
mantém UI, regra, dados e integração em arquivos separados; nada de arquivo
"faz-tudo". Limite: página ~200 linhas, componente/service ~250.

## Camadas

```
app/                      # rotas — page.tsx só COMPÕE seções (sem regra pesada)
  content/page.tsx        # Estúdio: compõe tabs + seções + editor (183 linhas)
  api/studio/*            # endpoints do estúdio (projects, templates, roteiro,
                          #   generate, export-png, images/*, brand-kit, upload)
modules/
  studio/                 # DOMÍNIO do estúdio de conteúdo (client-side)
    services/             # regra de negócio PURA (sem React, sem fetch)
      carouselBuilder.ts  #   autodidata: roteiro → template por tipo/estilo → slides
      slideOps.ts         #   operações puras de slide/elemento (add, clone, aplicar)
    api/
      studioClient.ts     #   ÚNICO ponto de fetch do estúdio (a UI não faz fetch)
    hooks/
      useAutosave.ts      #   PUT debouncado da versão nova do projeto
      useProjectExport.ts #   export PNG/HD/ZIP via render server-side
      useSlideImages.ts   #   busca/print/upload de imagem (IO), aplica via callback
components/
  content/                # seções da página do estúdio (apresentação)
    CriarComIaPanel · ProjetosGrid · ModelosGrid
  studio/                 # painéis do editor 3-colunas
    StudioEditor.tsx      #   ORQUESTRADOR: estado + hooks + ops, compõe os painéis (181 linhas)
    EditorTopbar · TemplateLibrary · SlideWorkspace · InspectorPanel
    EditorCanvas · StudioThumbnail · editorTheme.ts (paleta + botão compartilhados)
lib/
  studio/                 # PRIMITIVAS compartilhadas (usadas por rotas E UI)
    types · elementCss · slideToHtml · seedTemplates · brandKit · exportRenderer
  brain.ts                # base de conhecimento da marca (+ seção design)
  tenant.ts · db.ts · agente.ts (cascata NVIDIA) · ...
integrations/             # (reservado) uma pasta por API externa, se isolar mais
database/                 # (migrações vivem em supabase/ + Management API)
```

## Fronteiras (regra)

- **Página compõe, não decide.** `app/content/page.tsx` orquestra estado e
  compõe seções; a regra do carrossel vive em `modules/studio/services`.
- **UI não faz fetch.** Todo acesso a dados do estúdio passa por
  `modules/studio/api/studioClient.ts`.
- **Regra pura, isolada.** `carouselBuilder`/`slideOps` são funções puras (fáceis
  de testar; sem React nem IO).
- **Segredos só no servidor.** Chaves (NVIDIA, Supabase service, PAT) só nos
  route handlers / server. O client nunca as vê.

## Responsabilidades por camada (mapa rápido)

- **UI:** `app/content/page.tsx`, `components/content/*`, `components/studio/*`
- **Domínio:** `modules/studio/services/*`, `modules/studio/hooks/*`
- **Dados/API:** `modules/studio/api/studioClient.ts` + `app/api/studio/*`
- **Integrações/primitívas:** `lib/studio/*`, `lib/agente.ts`, `lib/brain.ts`
