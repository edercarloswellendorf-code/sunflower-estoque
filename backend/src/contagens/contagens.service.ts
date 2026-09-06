import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstanciaDto, SubmitRespostaDto } from './dto/contagem.dto';
import { gerarCodigo, isDomingo, mediana } from './contagens.util';

const JANELA_HISTORICO = 5;
const LIMITE_RAZAO_ANOMALIA = 5;

@Injectable()
export class ContagensService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInstanciaDto) {
    if (!isDomingo(dto.dataReferencia)) {
      throw new BadRequestException(
        'A data de referência precisa ser um domingo — o último dia do período de faturamento, não a data de hoje.',
      );
    }
    const codigo = gerarCodigo();
    return this.prisma.contagemInstancia.create({
      data: { codigo, dataReferencia: new Date(`${dto.dataReferencia}T00:00:00.000Z`) },
    });
  }

  async findAll() {
    const instancias = await this.prisma.contagemInstancia.findMany({
      orderBy: { dataReferencia: 'desc' },
      include: { respostas: true },
    });
    const grupos = await this.prisma.grupo.findMany({ include: { insumos: true } });

    return instancias.map((inst) => {
      const respondidos = new Set(inst.respostas.map((r) => r.insumoId));
      const status = grupos.map((g) => {
        const total = g.insumos.length;
        const contados = g.insumos.filter((gi) => respondidos.has(gi.insumoId)).length;
        return { grupoId: g.id, nome: g.nome, total, contados, completo: total > 0 && contados === total };
      });
      return {
        id: inst.id,
        codigo: inst.codigo,
        dataReferencia: inst.dataReferencia,
        criadoEm: inst.criadoEm,
        status,
      };
    });
  }

  async remove(id: string) {
    const instancia = await this.prisma.contagemInstancia.findUnique({ where: { id } });
    if (!instancia) throw new NotFoundException('Contagem não encontrada');
    await this.prisma.contagemInstancia.delete({ where: { id } });
    return { deleted: true };
  }

  async findByCodigo(codigo: string) {
    const instancia = await this.prisma.contagemInstancia.findUnique({
      where: { codigo },
      include: { respostas: true },
    });
    if (!instancia) throw new NotFoundException('Link inválido ou contagem não encontrada');

    const grupos = await this.prisma.grupo.findMany({
      include: { insumos: { include: { insumo: true }, orderBy: { ordem: 'asc' } } },
    });
    const respostasPorInsumo = Object.fromEntries(instancia.respostas.map((r) => [r.insumoId, r]));

    return {
      id: instancia.id,
      codigo: instancia.codigo,
      dataReferencia: instancia.dataReferencia,
      grupos: grupos.map((g) => ({
        id: g.id,
        nome: g.nome,
        itens: g.insumos.map((gi) => ({
          id: gi.insumo.id,
          nome: gi.insumo.nome,
          unidade: gi.insumo.unidade,
          jaContado: !!respostasPorInsumo[gi.insumoId],
        })),
      })),
    };
  }

  // histórico das últimas contagens de um insumo, olhando outras instâncias (ordenadas pela data de referência)
  private async historicoInsumo(insumoId: string, instanciaIdExcluir: string) {
    const respostas = await this.prisma.contagemResposta.findMany({
      where: { insumoId, instanciaId: { not: instanciaIdExcluir } },
      include: { instancia: true },
      orderBy: { instancia: { dataReferencia: 'asc' } },
    });
    return respostas.slice(-JANELA_HISTORICO).map((r) => ({
      valor: Number(r.valor),
      dataReferencia: r.instancia.dataReferencia,
    }));
  }

  async submitResposta(instanciaId: string, dto: SubmitRespostaDto) {
    const instancia = await this.prisma.contagemInstancia.findUnique({ where: { id: instanciaId } });
    if (!instancia) throw new NotFoundException('Contagem não encontrada');

    const insumo = await this.prisma.insumo.findUnique({ where: { id: dto.insumoId } });
    if (!insumo) throw new NotFoundException('Insumo não encontrado');

    const historico = await this.historicoInsumo(dto.insumoId, instanciaId);

    if (historico.length > 0 && !dto.confirmar) {
      const med = mediana(historico.map((h) => h.valor));
      let razao: number;
      if (med === 0 && dto.valor === 0) razao = 1;
      else if (med === 0 || dto.valor === 0) razao = Infinity;
      else razao = dto.valor >= med ? dto.valor / med : med / dto.valor;

      if (razao > LIMITE_RAZAO_ANOMALIA) {
        const ultimo = historico[historico.length - 1];
        return {
          salvo: false,
          precisaConfirmacao: true,
          valorAnterior: ultimo.valor,
          dataAnterior: ultimo.dataReferencia,
        };
      }
    }

    const resposta = await this.prisma.contagemResposta.upsert({
      where: { instanciaId_insumoId: { instanciaId, insumoId: dto.insumoId } },
      update: { valor: dto.valor, registradoEm: new Date() },
      create: { instanciaId, insumoId: dto.insumoId, valor: dto.valor },
    });

    return { salvo: true, precisaConfirmacao: false, resposta };
  }
}
