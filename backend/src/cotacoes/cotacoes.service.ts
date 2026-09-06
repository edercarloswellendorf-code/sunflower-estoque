import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCotacaoDto } from './dto/cotacao.dto';

@Injectable()
export class CotacoesService {
  constructor(private prisma: PrismaService) {}

  findByInsumo(insumoId: string) {
    return this.prisma.cotacao.findMany({ where: { insumoId }, orderBy: { preco: 'asc' } });
  }

  create(dto: CreateCotacaoDto) {
    return this.prisma.cotacao.create({ data: dto });
  }

  async remove(id: string) {
    await this.prisma.cotacao.delete({ where: { id } });
    return { deleted: true };
  }
}
