import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CotacoesService } from './cotacoes.service';
import { CreateCotacaoDto } from './dto/cotacao.dto';

@Controller('cotacoes')
export class CotacoesController {
  constructor(private readonly cotacoesService: CotacoesService) {}

  @Get()
  findByInsumo(@Query('insumoId') insumoId: string) {
    return this.cotacoesService.findByInsumo(insumoId);
  }

  @Post()
  create(@Body() dto: CreateCotacaoDto) {
    return this.cotacoesService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cotacoesService.remove(id);
  }
}
