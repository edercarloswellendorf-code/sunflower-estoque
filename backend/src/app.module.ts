import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { GruposModule } from './grupos/grupos.module';
import { InsumosModule } from './insumos/insumos.module';
import { ContagensModule } from './contagens/contagens.module';
import { ComprasModule } from './compras/compras.module';
import { CotacoesModule } from './cotacoes/cotacoes.module';

@Module({
  imports: [PrismaModule, GruposModule, InsumosModule, ContagensModule, ComprasModule, CotacoesModule],
})
export class AppModule {}
