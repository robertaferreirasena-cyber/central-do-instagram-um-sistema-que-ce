import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalizar texto para comparação sem acento
// Remove diacríticos, minúsculas, espaços em branco
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

// Validar e extrair e-mail de um texto
// Valida padrão básico e extrai de dentro do texto
export function isValidEmail(text: string): boolean {
  if (!text) return false;
  const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/;
  return emailRegex.test(text);
}

export function extractEmail(text: string): string | null {
  if (!text) return null;
  const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}
