# Sunflower · Estoque

Contagem semanal de estoque, link público sem login por grupo, lista de compras
automática e cotação de fornecedores para a rede Sunflower.

## Estrutura

- `backend/` — API em NestJS + Prisma + PostgreSQL
- `frontend/` — painel administrativo e página pública em Next.js

## Rodando localmente

### 1. Banco de dados

Suba um PostgreSQL local (ou use um serviço gerenciado) e copie a URL de conexão.

### 2. Backend

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

A API sobe em `http://localhost:3001/api`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # NEXT_PUBLIC_API_URL apontando para o backend
npm install
npm run dev
```

O painel abre em `http://localhost:3000` (redireciona para `/admin/grupos`).
A página pública de contagem fica em `/c/<codigo>`.

## Deploy

- **Backend + banco**: Railway (adicione um serviço PostgreSQL ao projeto —
  ele injeta `DATABASE_URL` automaticamente — e faça deploy da pasta `backend`).
- **Frontend**: Vercel, apontando `NEXT_PUBLIC_API_URL` para a URL pública do
  backend no Railway, e definindo `NEXT_PUBLIC_APP_URL` como o domínio do
  frontend (usado para montar o link público `/c/<codigo>`).
