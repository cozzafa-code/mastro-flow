// components/mobile/home/homeUtils.ts

export function iniziali(nome: string): string {
  return nome.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
}

export function caricoColor(p: number): { bar: string; text: string } {
  if (p >= 100) return { bar: '#A32D2D', text: '#A32D2D' }   // sovraccarico
  if (p >= 70)  return { bar: '#0F6E56', text: '#0F2A2A' }   // ottimale
  if (p > 0)    return { bar: '#6B8585', text: '#6B8585' }   // leggero
  return { bar: '#C8E4E4', text: '#6B8585' }                  // libero
}
