# Documentação Técnica — Responsividade 100%

**Projeto:** Central do Instagram  
**Data:** 2026-09-06  
**Padrão:** WCAG 2.5.5 Target Size + CSS Fluido

---

## Estratégia de Responsive Design

### 1. Fontes Fluidas (clamp)

Todas as fontes usam `clamp(mínimo, vw%, máximo)` para escalar suavemente:

```css
/* globals.css */
h1 { font-size: clamp(1.5rem, 5vw, 3rem); }
h2 { font-size: clamp(1.25rem, 3.5vw, 1.875rem); }
h3 { font-size: clamp(1rem, 2.5vw, 1.25rem); }
```

**Breakpoints implícitos:**
- 360px: 1.5rem (h1)
- 768px: 2.25rem (h1)
- 1440px+: 3rem (h1)

### 2. Touch Targets (44px mínimo)

Todos os elementos clicáveis têm `min-height: 44px`:

```css
/* globals.css */
button, [role="button"], input, select, textarea {
  min-height: 44px;
  min-width: 44px;
}

/* Sidebar */
.sidebar-toggle { min-height: 44px; min-width: 44px; }
```

### 3. Espaçamentos Responsivos

Padding e margin usam `clamp()` para variar com a viewport:

```css
/* layout.tsx */
[data-role="content"] {
  padding: clamp(1rem, 4vw, 2rem);
}

/* globals.css */
.card { padding: clamp(1rem, 4vw, 1.5rem); }
.btn-primary { 
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
}
```

---

## Breakpoints Implementados

### Media Queries Principais

```css
/* Desktop grande */
@media (min-width: 1025px) {
  [data-role="content"] { margin-left: 280px; }
  .sidebar-toggle { display: none; }
}

/* Tablet e acima */
@media (max-width: 1024px) {
  [data-role="content"] { margin-left: 0; padding-top: clamp(4rem, 10vw, 5.5rem); }
  aside { position: fixed; transform: translateX(...); }
}

/* Tablet grande */
@media (max-width: 768px) {
  .page-header-content { flex-direction: column; }
  .modelos-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
}

/* Mobile padrão */
@media (max-width: 640px) {
  h1 { font-size: clamp(1.25rem, 4vw, 1.75rem); }
  [data-role="content"] { padding-left: clamp(0.75rem, 2vw, 1rem); }
  .projetos-container { grid-template-columns: repeat(2, 1fr); }
}

/* Celular pequeno */
@media (max-width: 480px) {
  h1 { font-size: clamp(1.1rem, 3.5vw, 1.5rem); }
  .modelos-grid { grid-template-columns: repeat(2, 1fr); }
}
```

---

## Componentes Responsivos

### Sidebar

**Estados:**
- ≥1025px: Fixed left (desktop)
- 1024px: Fixed overlay, toggle button
- ≤640px: Max-width 85vw

**Touch targets:**
- Logo: `min-height: 44px`
- Menu links: `padding: clamp(0.6rem, 2vw, 0.75rem) clamp(0.8rem, 2vw, 1rem)` + `min-height: 44px`
- Workspace selector: `min-height: 44px`

### PageHeader

**Desktop (≥768px):**
```
┌─────────────────────────────────────┐
│ Tag                          [Actions]│
│ Título Grande                       │
│ Subtítulo                           │
└─────────────────────────────────────┘
```

**Mobile (<768px):**
```
┌──────────────────────┐
│ Tag                  │
│ Título Grande        │
│ Subtítulo            │
│ [Botões em coluna]   │
└──────────────────────┘
```

### ProjetosGrid

| Breakpoint | Grid | Coluna |
|-----------|------|---------|
| ≥1024px | `minmax(200px, 1fr)` | ~5 cols |
| 768px | `minmax(160px, 1fr)` | ~4 cols |
| 640px | `minmax(140px, 1fr)` | ~3 cols |
| ≤480px | `repeat(2, 1fr)` | 2 cols |

### ModelosGrid

| Breakpoint | Coluna |
|-----------|--------|
| ≥1024px | 4-5 |
| 768px | 3-4 |
| 640px | 3 |
| ≤480px | 2 |

---

## Viewport & Meta Tags

```html
<!-- layout.tsx -->
<meta name="viewport" content="width=device-width, initial-scale=1" />

<!-- Previne scroll horizontal -->
<style>
  html, body {
    width: 100%;
    overflow-x: hidden;
  }
</style>
```

---

## Testes de Validação

### Checklist WCAG 2.5.5
- ✅ Target size mínimo 44x44 CSS pixels
- ✅ Sem overlap de touch targets
- ✅ Funciona em orientação portrait/landscape
- ✅ Zoom 200% não causa scroll horizontal

### Testes em Breakpoints
```
npx next dev
# Abrir DevTools (F12)
# Testar em:
# - 360px (iPhone SE)
# - 390px (iPhone 12/13)
# - 768px (iPad)
# - 1024px (iPad Pro)
# - 1440px (Desktop)
```

### Performance
- Sem `any` type → Type-safe
- Sem libs externas → CSS puro
- Sem novo bundle → Sem impacto em performance

---

## Fallbacks e Compatibilidade

### Navegadores Suportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

### Degradação Graciosa
Se `clamp()` não for suportado (IE11):
```css
/* Fallback */
h1 { font-size: 2.5rem; } /* valor médio */
```
Nota: IE11 não é oficialmente suportado em Next.js 16.

---

## Arquivo de Referência de CSS Fluido

```css
/* Padrão de clamp() */
clamp(
  min-value,           /* Tamanho mínimo (360px) */
  preferred-value,     /* Porcentagem da viewport */
  max-value            /* Tamanho máximo (1440px+) */
)

/* Exemplos */
font-size: clamp(1rem, 2vw, 2rem);          /* min: 16px, max: 32px */
padding: clamp(0.5rem, 3vw, 1.5rem);        /* min: 8px, max: 24px */
gap: clamp(0.5rem, 2vw, 2rem);              /* min: 8px, max: 32px */
```

---

## Performance (CLS - Cumulative Layout Shift)

Fontes e espaçamentos fluidos previnem layout shifts:
- ❌ `font-size: 16px` → muda para `24px` em media query → shift
- ✅ `font-size: clamp(1rem, 2vw, 1.5rem)` → escala suavemente → sem shift

---

## Manutenção Futura

### Ao Adicionar Novo Componente
1. Use `clamp()` para fontes/espaços
2. Adicione `min-height: 44px` em botões/inputs
3. Teste em `max-width: 640px` no DevTools
4. Verifique `overflow-x` em mobile

### Ao Modificar Grid
```css
/* ❌ Errado */
grid-template-columns: repeat(4, 250px);  /* quebra em mobile */

/* ✅ Correto */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
/* Combinar com media query para ajustar minmax */
```

---

## Checklist de Código

- [x] Toda fonte usa `clamp()` ou é em `rem`
- [x] Touchable elements ≥ 44x44px
- [x] Sem layout quebrado em 360px-1440px
- [x] Sem scroll horizontal
- [x] Meta viewport presente
- [x] Nenhuma largura fixa em px (exceto em detalhes muito pequenos)
- [x] Todos os grids são responsivos
- [x] Sidebar funciona em mobile
- [x] Imagens com `max-width: 100%`

---

**Última Atualização:** 2026-09-06  
**Build:** ✅ Verificada  
**Status:** Pronto para produção
