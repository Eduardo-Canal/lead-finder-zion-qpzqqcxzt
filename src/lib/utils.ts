/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates a CNPJ string using the standard mod 11 algorithm
 * @param cnpj - CNPJ string
 * @returns true if valid, false otherwise
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false
  const cleaned = String(cnpj).replace(/[^\d]+/g, '')

  if (cleaned.length !== 14) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let tamanho = cleaned.length - 2
  let numeros = cleaned.substring(0, tamanho)
  const digitos = cleaned.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0))) return false

  tamanho = tamanho + 1
  numeros = cleaned.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1))) return false

  return true
}
