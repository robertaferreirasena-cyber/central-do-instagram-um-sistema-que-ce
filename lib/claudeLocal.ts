import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

// ============================================================================
// MOTOR CLAUDE LOCAL — usa o Claude Code CLI instalado na máquina da chefe
// (o MESMO motor que ela roda). Geração de texto de alta qualidade sem cota
// de API paga. SÓ funciona LOCAL (dev): na Vercel/serverless não há CLI, então
// é gated por process.env.VERCEL e SEMPRE tem fallback (cerebro NVIDIA).
// ============================================================================

function acharClaude(): string | null {
  const home = os.homedir();
  const candidatos = [
    path.join(home, '.local', 'bin', 'claude.exe'),
    process.env.APPDATA ? path.join(process.env.APPDATA, 'npm', 'claude.cmd') : '',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs', 'claude', 'claude.exe') : '',
    process.env.CLAUDE_BIN || '',
  ].filter(Boolean);
  for (const c of candidatos) {
    try { if (existsSync(c)) return c; } catch { /* ignora */ }
  }
  return null;
}

/** Diz se dá pra usar o Claude local aqui (nunca na Vercel). */
export function claudeLocalDisponivel(): boolean {
  if (process.env.VERCEL) return false;
  return acharClaude() !== null;
}

/**
 * Gera texto com o Claude local. Retorna null se indisponível/erro (o chamador
 * cai no fallback NVIDIA). O `system` é dobrado no início do prompt (evita
 * problemas de aspas ao passar como argumento de linha de comando).
 */
export async function gerarComClaude(
  prompt: string,
  opts?: { system?: string; model?: string; timeoutMs?: number }
): Promise<string | null> {
  if (process.env.VERCEL) return null; // NUNCA em produção serverless
  const bin = acharClaude();
  if (!bin) return null;

  const model = opts?.model || 'sonnet';
  const entrada = opts?.system ? `${opts.system}\n\n---\n\n${prompt}` : prompt;
  const isCmd = bin.toLowerCase().endsWith('.cmd');
  const exe = isCmd ? 'cmd.exe' : bin;
  const args = isCmd
    ? ['/c', bin, '--print', '--model', model, '--output-format', 'text']
    : ['--print', '--model', model, '--output-format', 'text'];

  return new Promise((resolve) => {
    let out = '';
    let err = '';
    let child;
    try {
      child = spawn(exe, args, { windowsHide: true });
    } catch {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => {
      try { child.kill(); } catch { /* ignora */ }
      resolve(null);
    }, opts?.timeoutMs || 90000);

    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('error', () => { clearTimeout(timer); resolve(null); });
    child.on('close', (code) => {
      clearTimeout(timer);
      const low = (out + err).toLowerCase();
      if (code !== 0 || low.includes('not logged in') || low.includes('/login') || !out.trim()) {
        resolve(null);
        return;
      }
      resolve(out.trim());
    });

    try {
      child.stdin.write(entrada);
      child.stdin.end();
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

/**
 * Igual a gerarComClaude, mas força a saída a ser um JSON válido (extrai o
 * primeiro objeto/array). Retorna null se não conseguir parsear.
 */
export async function gerarJsonComClaude<T = any>(
  prompt: string,
  opts?: { system?: string; model?: string; timeoutMs?: number }
): Promise<T | null> {
  const sys = (opts?.system ? opts.system + '\n' : '') +
    'Responda APENAS com JSON válido, sem markdown, sem cercas de código, sem texto antes ou depois.';
  const texto = await gerarComClaude(prompt, { ...opts, system: sys });
  if (!texto) return null;
  try {
    // tenta o texto puro; senão extrai o primeiro {...} ou [...]
    try { return JSON.parse(texto) as T; } catch { /* tenta extrair */ }
    const m = texto.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]) as T;
    return null;
  } catch {
    return null;
  }
}
