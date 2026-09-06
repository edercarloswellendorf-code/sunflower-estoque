import './globals.css';

export const metadata = {
  title: 'Sunflower · Estoque',
  description: 'Contagem semanal de estoque e cotação de fornecedores',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
