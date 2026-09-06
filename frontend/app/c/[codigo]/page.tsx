'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, PublicoGrupo, PublicoInstancia } from '@/lib/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

type Confirm = { insumoId: string; nome: string; unidade: string; novoValor: number; valorAnterior: number; dataAnterior: string };

export default function ContagemPublicaPage() {
  const params = useParams<{ codigo: string }>();
  const [instancia, setInstancia] = useState<PublicoInstancia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<PublicoGrupo | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.buscarPorCodigo(params.codigo);
      setInstancia(data);
    } catch (e: any) {
      setError(e.message || 'Link inválido ou contagem não encontrada.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [params.codigo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function commit(insumoId: string, nome: string, unidade: string, confirmar = false) {
    const raw = values[insumoId];
    if (raw === undefined || raw === '') return;
    const valor = Number(raw.replace(',', '.'));
    if (Number.isNaN(valor) || valor < 0) { setErrors((p) => ({ ...p, [insumoId]: 'Digite um número válido' })); return; }
    if (!instancia) return;

    const res = await api.enviarResposta(instancia.id, { insumoId, valor, confirmar });
    if (res.precisaConfirmacao) {
      setConfirm({ insumoId, nome, unidade, novoValor: valor, valorAnterior: res.valorAnterior!, dataAnterior: res.dataAnterior! });
      return;
    }
    setErrors((p) => ({ ...p, [insumoId]: '' }));
    setSaved((p) => ({ ...p, [insumoId]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [insumoId]: false })), 1800);
    load();
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--brown-soft)' }}>Carregando…</div>;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Contagem de estoque</h1>
      {instancia && <p style={{ color: 'var(--brown-soft)', fontSize: 14, marginTop: 4, marginBottom: 16 }}>Semana de referência: {formatDate(instancia.dataReferencia)}</p>}
      {error && <div style={{ background: 'var(--red-soft)', color: 'var(--red)', borderRadius: 8, padding: 12, fontSize: 14 }}>{error}</div>}

      {instancia && !activeGroup && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {instancia.grupos.map((g) => {
            const total = g.itens.length;
            const contados = g.itens.filter((i) => i.jaContado).length;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g)}
                className="card"
                style={{ padding: 16, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <span>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 500 }}>{g.nome}</span>
                  <span style={{ display: 'block', fontSize: 14, color: 'var(--brown-soft)', marginTop: 2 }}>{total} {total === 1 ? 'item' : 'itens'}</span>
                </span>
                <span style={{ fontSize: 14, color: total > 0 && contados === total ? 'var(--black)' : 'var(--brown-soft)' }}>
                  {total > 0 && contados === total ? '✓ concluído' : `${contados}/${total}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {instancia && activeGroup && (
        <div>
          <button onClick={() => setActiveGroup(null)} style={{ border: 'none', background: 'none', color: 'var(--brown-soft)', fontSize: 14, marginBottom: 10, cursor: 'pointer', padding: 0 }}>‹ Trocar grupo</button>
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>{activeGroup.nome}</h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            {activeGroup.itens.map((item) => {
              const value = values[item.id] ?? '';
              const err = errors[item.id];
              return (
                <div key={item.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{item.nome}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => setValues((p) => ({ ...p, [item.id]: e.target.value }))}
                      onBlur={() => commit(item.id, item.nome, item.unidade)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      placeholder="0"
                      className="input"
                      style={{ width: 100, textAlign: 'right', fontSize: 22, fontWeight: 500, borderColor: err ? 'var(--red)' : undefined }}
                    />
                    <span style={{ color: 'var(--brown-soft)', fontSize: 14 }}>{item.unidade}</span>
                    <span style={{ width: 20 }}>{saved[item.id] && '✓'}</span>
                  </div>
                  {err && <span style={{ color: 'var(--red)', fontSize: 12 }}>{err}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(62,42,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card" style={{ maxWidth: 360, width: '100%', padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Valor fora do padrão</h2>
            <p style={{ color: 'var(--brown-soft)', fontSize: 14, marginTop: 8 }}>
              Você digitou <strong style={{ color: 'var(--brown)' }}>{confirm.novoValor} {confirm.unidade}</strong> para{' '}
              <strong style={{ color: 'var(--brown)' }}>{confirm.nome}</strong>. A contagem anterior foi{' '}
              <strong style={{ color: 'var(--brown)' }}>{confirm.valorAnterior} {confirm.unidade}</strong> (semana de {formatDate(confirm.dataAnterior)}). Confirma que é isso mesmo?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setConfirm(null)} className="btn btn-outline">Corrigir valor</button>
              <button
                onClick={async () => { await commit(confirm.insumoId, confirm.nome, confirm.unidade, true); setConfirm(null); }}
                className="btn btn-black"
              >
                Confirmar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
