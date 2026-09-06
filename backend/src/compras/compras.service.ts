import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComprasService {
  constructor(private prisma: PrismaService) {}

  async listaPorInstancia(instanciaId: string) {
    const instancia = await this.prisma.contagemInstancia.findUnique({
      where: { id: instanciaId },
      include: { respostas: true },
    });
    if (!instancia) throw new NotFoundException('Contagem não encontrada');

    const insumos = await this.prisma.insumo.findMany({ orderBy: { nome: 'asc' } });
    const respostaPorInsumo = Object.fromEntries(instancia.respostas.map((r) => [r.insumoId, Number(r.valor)]));

    return insumos.map((insumo) => {
      const contagem = respostaPorInsumo[insumo.id] ?? null;
      const min = insumo.min !== null ? Number(insumo.min) : null;
      const max = insumo.max !== null ? Number(insumo.max) : null;
      let sugestao = 0;
      if (contagem !== null && min !== null && max !== null && contagem < min) {
        sugestao = Math.max(0, max - contagem);
      }
      return {
        insumoId: insumo.id,
        nome: insumo.nome,
        unidade: insumo.unidade,
        contagem,
        min,
        max,
        sugestaoCompra: sugestao,
      };
    });
  }
}
