'use client';

import { useEffect, useState } from 'react';
import { api, Grupo, Insumo } from '@/lib/api';

export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [search, setSearch] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const [g, i] = await Promise.all([api.listarGrupos(), api.listarInsumos()]);
    setGrupos(g);
    setInsumos(i);
    if (!activeId && g.length > 0) setActiveId(g[0].id);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeGroup = grupos.find((g) => g.id === activeId) || null;
  const assignedIds = new Set(grupos.flatMap((g) => g.itens.map((i) => i.id)));
  const pool = insumos.filter((i) => !assignedIds.has(i.id) && i.nome.toLowerCase().includes(search.toLowerCase()));

  async function handleAddGroup() {
    const nome = newGroupName.trim();
    if (!nome) return;
    const created = await api.criarGrupo(nome);
    setNewGroupName('');
    setAddingGroup(false);
    setActiveId(created.id);
    load();
  }
  async function handleRename(id: string) {
    const nome = renameValue.trim();
    setRenamingId(null);
    if (nome) { await api.renomearGrupo(id, nome); load(); }
  }
  async function handleDelete(id: string) {
    await api.excluirGrupo(id);
    if (activeId === id) setActiveId(null);
    load();
  }
  async function handleAssign(insumoId: string) {
    if (!activeId) return;
    await api.atribuirInsumo(activeId, insumoId);
    load();
  }
  async function handleUnassign(insumoId: string) {
    if (!activeId) return;
    await api.removerInsumo(activeId, insumoId);
    load();
  }
  async function handleDrop(targetIndex: number) {
    if (dragIndex === null || !activeGroup || dragIndex === targetIndex) { setDragIndex(null); return; }
    const ids = activeGroup.itens.map((i) => i.id);
    const [moved] = ids.splice(dragIndex, 1);
    ids.splice(targetIndex, 0, moved);
    setDragIndex(null);
    await api.reordenarGrupo(activeGroup.id, ids);
    load();
  }

  if (loading) return <p style={{ color: 'var(--brown-soft)' }}>Carregando…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Grupos de contagem</h1>
      <p style={{ color: 'var(--brown-soft)', fontSize: 14, marginTop: 4, marginBottom: 20 }}>
        Organize os insumos pelos locais físicos e defina a ordem da prateleira
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Locais */}
        <div className="card" style={{ width: 240, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid var(--border)', padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', color: 'var(--brown-soft)' }}>Locais</div>
          {grupos.map((g) => {
            const active = g.id === activeId;
            return (
              <div
                key={g.id}
                onClick={() => setActiveId(g.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: active ? 'var(--yellow)' : 'transparent' }}
              >
                {renamingId === g.id ? (
                  <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onClick={(e) => e.stopPropagation()} onBlur={() => handleRename(g.id)} onKeyDown={(e) => e.key === 'Enter' && handleRename(g.id)} className="input" style={{ flex: 1, minWidth: 0 }} />
                ) : (
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: active ? 'var(--yellow-deep)' : 'var(--brown)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.nome}</span>
                )}
                <span style={{ fontSize: 12, color: active ? 'var(--yellow-deep)' : 'var(--brown-soft)' }}>{g.itens.length}</span>
                <button onClick={(e) => { e.stopPropagation(); setRenamingId(g.id); setRenameValue(g.nome); }} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.6 }}>✎</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(g.id); }} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.6 }}>🗑</button>
              </div>
            );
          })}
          <div style={{ padding: 8 }}>
            {addingGroup ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <input autoFocus value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()} placeholder="Nome do local" className="input" style={{ flex: 1, minWidth: 0 }} />
                <button onClick={handleAddGroup} className="btn btn-black">✓</button>
                <button onClick={() => { setAddingGroup(false); setNewGroupName(''); }} className="btn btn-outline">✕</button>
              </div>
            ) : (
              <button onClick={() => setAddingGroup(true)} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>+ Novo grupo</button>
            )}
          </div>
        </div>

        {/* Ordem física */}
        <div className="card" style={{ flex: 1, minWidth: 260, overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid var(--border)', padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', color: 'var(--brown-soft)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{activeGroup ? `Ordem física — ${activeGroup.nome}` : 'Ordem física'}</span>
            {activeGroup && <span>{activeGroup.itens.length} itens</span>}
          </div>
          {!activeGroup && <p style={{ padding: 16, color: 'var(--brown-soft)', fontSize: 14 }}>Selecione ou crie um grupo à esquerda.</p>}
          {activeGroup?.itens.length === 0 && <p style={{ padding: 16, color: 'var(--brown-soft)', fontSize: 14 }}>Nenhum insumo neste grupo ainda.</p>}
          {activeGroup?.itens.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)', cursor: 'grab', opacity: dragIndex === index ? 0.4 : 1 }}
            >
              <span style={{ color: 'var(--brown-soft)' }}>⠿</span>
              <span style={{ fontSize: 12, color: 'var(--brown-soft)', width: 18 }}>{index + 1}</span>
              <span style={{ flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nome}</span>
              <span style={{ fontSize: 12, color: 'var(--brown-soft)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{item.unidade}</span>
              <button onClick={() => handleUnassign(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.6 }}>✕</button>
            </div>
          ))}
        </div>

        {/* Sem grupo */}
        <div className="card" style={{ width: 320, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid var(--border)', padding: 12 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--brown-soft)', marginBottom: 6 }}>Insumos sem grupo ({pool.length})</div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar insumo" className="input" style={{ width: '100%' }} />
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {pool.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ flex: 1, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nome}</span>
                <span style={{ fontSize: 12, color: 'var(--brown-soft)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{item.unidade}</span>
                <button onClick={() => handleAssign(item.id)} disabled={!activeId} className="btn btn-black" style={{ padding: '2px 8px' }}>+</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
