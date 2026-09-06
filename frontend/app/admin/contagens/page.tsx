'use client';

import { useEffect, useState } from 'react';
import { api, Instancia } from '@/lib/api';

const LINK_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://contagem.sunflower.com.br';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
function mostRecentPastSunday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 7 : day;
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  return sunday.toISOString().slice(0, 10);
}

export default function ContagensPage() {
  const [instancias, setInstancias] = useState<Instancia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState(mostRecentPastSunday());
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setInstancias(await api.listarInstancias());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function buildLink(codigo: string) { return `${LINK_DOMAIN}/c/${codigo}`; }

  async function handleCreate() {
    setError(null);
    try {
      await api.criarInstancia(newDate);
      setShowForm(false);
      setNewDate(mostRecentPastSunday());
      load();
    } catch (e: any) {
      setError(e.message || 'Não foi possível criar a contagem.');
    }
  }
  async function handleDelete(id: string) {
    await api.excluirInstancia(id);
    load();
  }
  async function handleCopy(codigo: string) {
    try { await navigator.clipboard.writeText(buildLink(codigo)); setCopied(codigo); setTimeout(() => setCopied(null), 1500); } catch {}
  }

  if (loading) return <p style={{ color: 'var(--brown-soft)' }}>Carregando…</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Contagens semanais</h1>
          <p style={{ color: 'var(--brown-soft)', fontSize: 14, marginTop: 4 }}>Painel do administrador</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn btn-yellow">+ Nova contagem</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 16, marginBottom: 20, maxWidth: 400 }}>
          <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Data de referência</label>
          <input type="date" value={newDate} onChange={(e) => { setNewDate(e.target.value); setError(null); }} className="input" />
          <p style={{ color: 'var(--brown-soft)', fontSize: 12, marginTop: 6 }}>
            Deve ser sempre um domingo — o último dia do seu período de faturamento, não a data de hoje.
          </p>
          {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={handleCreate} className="btn btn-black">Criar contagem</button>
            <button onClick={() => { setShowForm(false); setError(null); }} className="btn btn-outline">Cancelar</button>
          </div>
        </div>
      )}

      {instancias.length === 0 && <p style={{ color: 'var(--brown-soft)', fontSize: 14 }}>Nenhuma contagem criada ainda.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
        {instancias.map((inst) => (
          <div key={inst.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 500, display: 'block' }}>Semana de referência: {formatDate(inst.dataReferencia)}</span>
                <span style={{ fontSize: 12, color: 'var(--brown-soft)' }}>criada em {new Date(inst.criadoEm).toLocaleString('pt-BR')}</span>
              </div>
              <button onClick={() => handleDelete(inst.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.6 }}>🗑</button>
            </div>
            <div style={{ background: 'var(--gray)', borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
              <span style={{ fontSize: 12, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buildLink(inst.codigo)}</span>
              <button onClick={() => handleCopy(inst.codigo)} className="btn btn-outline" style={{ padding: '2px 8px', fontSize: 12 }}>
                {copied === inst.codigo ? 'copiado' : 'copiar'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {inst.status.map((s) => (
                <span key={s.grupoId} className={`badge ${s.completo ? 'badge-black' : 'badge-yellow'}`}>
                  {s.nome}: {s.contados}/{s.total}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
