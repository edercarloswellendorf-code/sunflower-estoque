import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GruposService } from './grupos.service';
import { CreateGrupoDto, UpdateGrupoDto, AssignInsumoDto, ReorderGrupoDto } from './dto/grupo.dto';

@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get()
  findAll() {
    return this.gruposService.findAll();
  }

  @Post()
  create(@Body() dto: CreateGrupoDto) {
    return this.gruposService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGrupoDto) {
    return this.gruposService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gruposService.remove(id);
  }

  @Post(':id/insumos')
  assign(@Param('id') id: string, @Body() dto: AssignInsumoDto) {
    return this.gruposService.assignInsumo(id, dto);
  }

  @Delete(':id/insumos/:insumoId')
  unassign(@Param('id') id: string, @Param('insumoId') insumoId: string) {
    return this.gruposService.unassignInsumo(id, insumoId);
  }

  @Patch(':id/reorder')
  reorder(@Param('id') id: string, @Body() dto: ReorderGrupoDto) {
    return this.gruposService.reorder(id, dto);
  }
}
