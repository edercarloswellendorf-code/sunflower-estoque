const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Erro ${res.status} ao chamar ${path}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export type Insumo = { id: string; nome: string; unidade: string; min: number | null; max: number | null };
export type GrupoItem = { id: string; nome: string; unidade: string };
export type Grupo = { id: string; nome: string; itens: GrupoItem[] };
export type StatusGrupo = { grupoId: string; nome: string; total: number; contados: number; completo: boolean };
export type Instancia = { id: string; codigo: string; dataReferencia: string; criadoEm: string; status: StatusGrupo[] };
export type CompraItem = {
  insumoId: string; nome: string; unidade: string; contagem: number | null; min: number | null; max: number | null; sugestaoCompra: number;
};
export type Cotacao = { id: string; insumoId: string; fornecedor: string; preco: number; criadoEm: string };
export type PublicoItem = { id: string; nome: string; unidade: string; jaContado: boolean };
export type PublicoGrupo = { id: string; nome: string; itens: PublicoItem[] };
export type PublicoInstancia = { id: string; codigo: string; dataReferencia: string; grupos: PublicoGrupo[] };

export const api = {
  // Insumos
  listarInsumos: (): Promise<Insumo[]> => request('/insumos'),
  atualizarInsumo: (id: string, data: { min?: number; max?: number }) =>
    request(`/insumos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Grupos
  listarGrupos: (): Promise<Grupo[]> => request('/grupos'),
  criarGrupo: (nome: string) => request('/grupos', { method: 'POST', body: JSON.stringify({ nome }) }),
  renomearGrupo: (id: string, nome: string) => request(`/grupos/${id}`, { method: 'PATCH', body: JSON.stringify({ nome }) }),
  excluirGrupo: (id: string) => request(`/grupos/${id}`, { method: 'DELETE' }),
  atribuirInsumo: (grupoId: string, insumoId: string) =>
    request(`/grupos/${grupoId}/insumos`, { method: 'POST', body: JSON.stringify({ insumoId }) }),
  removerInsumo: (grupoId: string, insumoId: string) =>
    request(`/grupos/${grupoId}/insumos/${insumoId}`, { method: 'DELETE' }),
  reordenarGrupo: (grupoId: string, insumoIds: string[]) =>
    request(`/grupos/${grupoId}/reorder`, { method: 'PATCH', body: JSON.stringify({ insumoIds }) }),

  // Contagens
  listarInstancias: (): Promise<Instancia[]> => request('/contagens'),
  criarInstancia: (dataReferencia: string): Promise<Instancia> =>
    request('/contagens', { method: 'POST', body: JSON.stringify({ dataReferencia }) }),
  excluirInstancia: (id: string) => request(`/contagens/${id}`, { method: 'DELETE' }),
  buscarPorCodigo: (codigo: string): Promise<PublicoInstancia> => request(`/contagens/codigo/${codigo}`),
  enviarResposta: (
    instanciaId: string,
    body: { insumoId: string; valor: number; confirmar?: boolean },
  ): Promise<{ salvo: boolean; precisaConfirmacao: boolean; valorAnterior?: number; dataAnterior?: string }> =>
    request(`/contagens/${instanciaId}/respostas`, { method: 'POST', body: JSON.stringify(body) }),

  // Compras
  listaCompras: (instanciaId: string): Promise<CompraItem[]> => request(`/compras?instanciaId=${instanciaId}`),

  // Cotações
  listarCotacoes: (insumoId: string): Promise<Cotacao[]> => request(`/cotacoes?insumoId=${insumoId}`),
  criarCotacao: (insumoId: string, fornecedor: string, preco: number) =>
    request('/cotacoes', { method: 'POST', body: JSON.stringify({ insumoId, fornecedor, preco }) }),
  excluirCotacao: (id: string) => request(`/cotacoes/${id}`, { method: 'DELETE' }),
};
