import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrupoDto, UpdateGrupoDto, AssignInsumoDto, ReorderGrupoDto } from './dto/grupo.dto';

@Injectable()
export class GruposService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const grupos = await this.prisma.grupo.findMany({
      orderBy: { criadoEm: 'asc' },
      include: { insumos: { include: { insumo: true }, orderBy: { ordem: 'asc' } } },
    });
    return grupos.map((g) => ({
      id: g.id,
      nome: g.nome,
      itens: g.insumos.map((gi) => ({ id: gi.insumo.id, nome: gi.insumo.nome, unidade: gi.insumo.unidade })),
    }));
  }

  create(dto: CreateGrupoDto) {
    return this.prisma.grupo.create({ data: { nome: dto.nome } });
  }

  async update(id: string, dto: UpdateGrupoDto) {
    await this.assertExists(id);
    return this.prisma.grupo.update({ where: { id }, data: { nome: dto.nome } });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.grupo.delete({ where: { id } });
    return { deleted: true };
  }

  async assignInsumo(grupoId: string, dto: AssignInsumoDto) {
    await this.assertExists(grupoId);
    const insumo = await this.prisma.insumo.findUnique({ where: { id: dto.insumoId } });
    if (!insumo) throw new NotFoundException('Insumo não encontrado');

    const count = await this.prisma.grupoInsumo.count({ where: { grupoId } });

    // um insumo só pode estar em um grupo por vez: remove de onde estava e recoloca no fim deste
    await this.prisma.grupoInsumo.deleteMany({ where: { insumoId: dto.insumoId } });
    return this.prisma.grupoInsumo.create({
      data: { grupoId, insumoId: dto.insumoId, ordem: count },
    });
  }

  async unassignInsumo(grupoId: string, insumoId: string) {
    await this.prisma.grupoInsumo.deleteMany({ where: { grupoId, insumoId } });
    return { removed: true };
  }

  async reorder(grupoId: string, dto: ReorderGrupoDto) {
    await this.assertExists(grupoId);
    const existentes = await this.prisma.grupoInsumo.findMany({ where: { grupoId } });
    const idsExistentes = new Set(existentes.map((e) => e.insumoId));
    const idsRecebidos = new Set(dto.insumoIds);

    if (idsExistentes.size !== idsRecebidos.size || [...idsExistentes].some((id) => !idsRecebidos.has(id))) {
      throw new BadRequestException('A lista enviada precisa conter exatamente os insumos já pertencentes a este grupo');
    }

    await this.prisma.$transaction(
      dto.insumoIds.map((insumoId, index) =>
        this.prisma.grupoInsumo.update({
          where: { grupoId_insumoId: { grupoId, insumoId } },
          data: { ordem: index },
        }),
      ),
    );
    return { reordered: true };
  }

  private async assertExists(id: string) {
    const grupo = await this.prisma.grupo.findUnique({ where: { id } });
    if (!grupo) throw new NotFoundException('Grupo não encontrado');
  }
}
