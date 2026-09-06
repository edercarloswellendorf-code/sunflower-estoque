import { randomBytes } from 'crypto';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

// Gera um código aleatório e imprevisível para o link público (nunca sequencial)
export function gerarCodigo(len = 12): string {
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return out;
}

// A data de referência precisa ser sempre um domingo (último dia do período de faturamento)
export function isDomingo(dataISO: string): boolean {
  const [y, m, d] = dataISO.split('-').map(Number);
  const data = new Date(Date.UTC(y, m - 1, d));
  return data.getUTCDay() === 0;
}

export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenado = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenado.length / 2);
  return ordenado.length % 2 !== 0 ? ordenado[meio] : (ordenado[meio - 1] + ordenado[meio]) / 2;
}
