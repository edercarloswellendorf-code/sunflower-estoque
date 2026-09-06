import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { InsumosService } from './insumos.service';
import { UpdateInsumoDto } from './dto/update-insumo.dto';

@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Get()
  findAll() {
    return this.insumosService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInsumoDto) {
    return this.insumosService.update(id, dto);
  }
}
