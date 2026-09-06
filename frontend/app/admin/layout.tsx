'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin/grupos', label: 'Grupos de contagem' },
  { href: '/admin/contagens', label: 'Contagens semanais' },
  { href: '/admin/compras', label: 'Lista de compras' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ background: 'var(--brown)', width: 220, flexShrink: 0, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ padding: '8px 10px', marginBottom: 4 }}>
          <span style={{ color: 'var(--yellow)', fontSize: 14, fontWeight: 500 }}>Sunflower · Estoque</span>
        </div>
        {NAV.map((n) => {
          const active = pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              style={{
                display: 'block',
                fontSize: 14,
                borderRadius: 6,
                padding: '8px 10px',
                textDecoration: 'none',
                background: active ? 'var(--yellow)' : 'transparent',
                color: active ? 'var(--brown)' : '#EFE7D8',
              }}
            >
              {n.label}
            </Link>
          );
        })}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: 24 }}>{children}</div>
    </div>
  );
}
