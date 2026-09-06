import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInsumoDto } from './dto/update-insumo.dto';

@Injectable()
export class InsumosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.insumo.findMany({ orderBy: { nome: 'asc' } });
  }

  async update(id: string, dto: UpdateInsumoDto) {
    const insumo = await this.prisma.insumo.findUnique({ where: { id } });
    if (!insumo) throw new NotFoundException('Insumo não encontrado');
    return this.prisma.insumo.update({
      where: { id },
      data: { min: dto.min, max: dto.max },
    });
  }
}
