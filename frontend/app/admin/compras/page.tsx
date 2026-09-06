'use client';

import { useEffect, useState } from 'react';
import { api, CompraItem, Cotacao, Instancia } from '@/lib/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ComprasPage() {
  const [instancias, setInstancias] = useState<Instancia[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [rows, setRows] = useState<CompraItem[]>([]);
  const [onlyPending, setOnlyPending] = useState(true);
  const [selectedInsumoId, setSelectedInsumoId] = useState<string | null>(null);
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [fornecedor, setFornecedor] = useState('');
  const [preco, setPreco] = useState('');
  const [loading, setLoading] = useState(true);
  const [minMaxDraft, setMinMaxDraft] = useState<Record<string, { min: string; max: string }>>({});

  useEffect(() => {
    (async () => {
      const list = await api.listarInstancias();
      setInstancias(list);
      if (list.length > 0) {
        const latest = [...list].sort((a, b) => b.dataReferencia.localeCompare(a.dataReferencia))[0];
        setSelectedInstanceId(latest.id);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedInstanceId) return;
    api.listaCompras(selectedInstanceId).then((data) => {
      setRows(data);
      const draft: Record<string, { min: string; max: string }> = {};
      data.forEach((r) => { draft[r.insumoId] = { min: r.min?.toString() ?? '', max: r.max?.toString() ?? '' }; });
      setMinMaxDraft(draft);
    });
  }, [selectedInstanceId]);

  useEffect(() => {
    if (selectedInsumoId) api.listarCotacoes(selectedInsumoId).then(setCotacoes);
    else setCotacoes([]);
  }, [selectedInsumoId]);

  async function commitMinMax(insumoId: string) {
    const draft = minMaxDraft[insumoId];
    if (!draft) return;
    const min = draft.min === '' ? undefined : Number(draft.min);
    const max = draft.max === '' ? undefined : Number(draft.max);
    await api.atualizarInsumo(insumoId, { min, max });
    const data = await api.listaCompras(selectedInstanceId);
    setRows(data);
  }

  async function addQuote() {
    if (!selectedInsumoId) return;
    const precoNum = Number(preco.replace(',', '.'));
    if (!fornecedor.trim() || Number.isNaN(precoNum) || precoNum <= 0) return;
    await api.criarCotacao(selectedInsumoId, fornecedor.trim(), precoNum);
    setFornecedor('');
    setPreco('');
    setCotacoes(await api.listarCotacoes(selectedInsumoId));
  }
  async function removeQuote(id: string) {
    await api.excluirCotacao(id);
    if (selectedInsumoId) setCotacoes(await api.listarCotacoes(selectedInsumoId));
  }

  if (loading) return <p style={{ color: 'var(--brown-soft)' }}>Carregando…</p>;
  if (instancias.length === 0) return <p style={{ color: 'var(--brown-soft)', fontSize: 14 }}>Crie uma contagem semanal antes de gerar a lista de compras.</p>;

  const visibleRows = onlyPending ? rows.filter((r) => r.sugestaoCompra > 0) : rows;
  const pendingCount = rows.filter((r) => r.sugestaoCompra > 0).length;
  const selectedRow = rows.find((r) => r.insumoId === selectedInsumoId) || null;
  const sortedQuotes = [...cotacoes].sort((a, b) => a.preco - b.preco);
  const menor = sortedQuotes[0]?.preco ?? null;
  const maior = sortedQuotes[sortedQuotes.length - 1]?.preco ?? null;
  const economiaUnit = sortedQuotes.length >= 2 && menor !== null && maior !== null ? maior - menor : 0;
  const economiaTotal = selectedRow && selectedRow.sugestaoCompra > 0 ? economiaUnit * selectedRow.sugestaoCompra : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Lista de compras</h1>
          <p style={{ color: 'var(--brown-soft)', fontSize: 14, marginTop: 4 }}>{pendingCount} {pendingCount === 1 ? 'item precisa' : 'itens precisam'} de compra nesta semana</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={selectedInstanceId} onChange={(e) => setSelectedInstanceId(e.target.value)} className="input">
            {[...instancias].sort((a, b) => b.dataReferencia.localeCompare(a.dataReferencia)).map((inst) => (
              <option key={inst.id} value={inst.id}>Semana de {formatDate(inst.dataReferencia)}</option>
            ))}
          </select>
          <label style={{ fontSize: 14, color: 'var(--brown-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> só o que precisa comprar
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: 1, minWidth: 320, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px 60px 70px', gap: 8, padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', color: 'var(--brown-soft)', borderBottom: '1px solid var(--border)' }}>
            <span>Insumo</span><span style={{ textAlign: 'right' }}>Contagem</span><span style={{ textAlign: 'right' }}>Mín.</span><span style={{ textAlign: 'right' }}>Máx.</span><span style={{ textAlign: 'right' }}>Comprar</span>
          </div>
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {visibleRows.map((r) => {
              const selected = r.insumoId === selectedInsumoId;
              const draft = minMaxDraft[r.insumoId] || { min: '', max: '' };
              return (
                <div
                  key={r.insumoId}
                  onClick={() => setSelectedInsumoId(r.insumoId)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 70px 60px 60px 70px', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center', cursor: 'pointer', fontSize: 14, background: selected ? 'var(--yellow-soft)' : r.sugestaoCompra > 0 ? 'var(--red-soft)' : 'transparent' }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nome}</span>
                  <span style={{ textAlign: 'right', color: 'var(--brown-soft)' }}>{r.contagem !== null ? `${r.contagem} ${r.unidade}` : '—'}</span>
                  <input
                    value={draft.min}
                    onChange={(e) => setMinMaxDraft((prev) => ({ ...prev, [r.insumoId]: { ...prev[r.insumoId], min: e.target.value } }))}
                    onBlur={() => commitMinMax(r.insumoId)}
                    onClick={(e) => e.stopPropagation()}
                    className="input"
                    style={{ textAlign: 'right', padding: '2px 6px' }}
                  />
                  <input
                    value={draft.max}
                    onChange={(e) => setMinMaxDraft((prev) => ({ ...prev, [r.insumoId]: { ...prev[r.insumoId], max: e.target.value } }))}
                    onBlur={() => commitMinMax(r.insumoId)}
                    onClick={(e) => e.stopPropagation()}
                    className="input"
                    style={{ textAlign: 'right', padding: '2px 6px' }}
                  />
                  <span style={{ textAlign: 'right', fontWeight: 500, color: r.sugestaoCompra > 0 ? 'var(--red)' : 'var(--brown-soft)' }}>
                    {r.sugestaoCompra > 0 ? `${r.sugestaoCompra} ${r.unidade}` : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ width: 360, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', color: 'var(--brown-soft)', borderBottom: '1px solid var(--border)' }}>Cotação de fornecedores</div>
          {!selectedRow ? (
            <p style={{ padding: 16, color: 'var(--brown-soft)', fontSize: 14 }}>Selecione um item da lista para lançar e comparar cotações.</p>
          ) : (
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{selectedRow.nome}</div>
              {selectedRow.sugestaoCompra > 0 && <p style={{ fontSize: 12, color: 'var(--brown-soft)', marginBottom: 10 }}>Sugestão de compra: {selectedRow.sugestaoCompra} {selectedRow.unidade}</p>}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Fornecedor" className="input" style={{ flex: 1, minWidth: 0 }} />
                <input value={preco} onChange={(e) => setPreco(e.target.value)} placeholder={`Preço (${selectedRow.unidade})`} className="input" style={{ width: 110 }} />
                <button onClick={addQuote} className="btn btn-black">+</button>
              </div>
              {sortedQuotes.length === 0 && <p style={{ color: 'var(--brown-soft)', fontSize: 14 }}>Nenhuma cotação lançada para este item ainda.</p>}
              {sortedQuotes.map((q, idx) => (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.fornecedor}
                    {idx === 0 && sortedQuotes.length > 1 && <span className="badge badge-black">melhor opção</span>}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{brl(q.preco)}</span>
                    <button onClick={() => removeQuote(q.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.6 }}>🗑</button>
                  </span>
                </div>
              ))}
              {sortedQuotes.length >= 2 && (
                <div style={{ background: 'var(--black-soft)', borderRadius: 6, padding: 10, marginTop: 10 }}>
                  <div style={{ color: 'var(--black)', fontSize: 14, fontWeight: 500 }}>Economia estimada</div>
                  <p style={{ color: 'var(--brown-soft)', fontSize: 12, marginTop: 4 }}>
                    {brl(economiaUnit)} por {selectedRow.unidade.toLowerCase()} escolhendo o fornecedor mais barato em vez do mais caro.
                    {selectedRow.sugestaoCompra > 0 && <> Na compra sugerida de {selectedRow.sugestaoCompra} {selectedRow.unidade}, isso representa {brl(economiaTotal)}.</>}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
