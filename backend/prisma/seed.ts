import { PrismaClient } from '@prisma/client';
import insumosSeed from './insumos.json';

const prisma = new PrismaClient();

async function main() {
  console.log(`Semeando ${insumosSeed.length} insumos...`);
  for (const item of insumosSeed as { nome: string; unidade: string }[]) {
    const existente = await prisma.insumo.findFirst({ where: { nome: item.nome } });
    if (!existente) {
      await prisma.insumo.create({ data: { nome: item.nome, unidade: item.unidade } });
    }
  }

  const nomesGrupos = ['Geladeira 1', 'Freezer', 'Estoque seco'];
  for (const nome of nomesGrupos) {
    const existente = await prisma.grupo.findFirst({ where: { nome } });
    if (!existente) {
      await prisma.grupo.create({ data: { nome } });
      console.log(`Grupo criado: ${nome}`);
    }
  }

  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
