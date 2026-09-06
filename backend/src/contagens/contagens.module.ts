import { Module } from '@nestjs/common';
import { ContagensController } from './contagens.controller';
import { ContagensService } from './contagens.service';

@Module({
  controllers: [ContagensController],
  providers: [ContagensService],
})
export class ContagensModule {}
