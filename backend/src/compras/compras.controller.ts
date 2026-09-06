import { Controller, Get, Query } from '@nestjs/common';
import { ComprasService } from './compras.service';

@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get()
  lista(@Query('instanciaId') instanciaId: string) {
    return this.comprasService.listaPorInstancia(instanciaId);
  }
}
