import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ContagensService } from './contagens.service';
import { CreateInstanciaDto, SubmitRespostaDto } from './dto/contagem.dto';

@Controller('contagens')
export class ContagensController {
  constructor(private readonly contagensService: ContagensService) {}

  @Get()
  findAll() {
    return this.contagensService.findAll();
  }

  @Post()
  create(@Body() dto: CreateInstanciaDto) {
    return this.contagensService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contagensService.remove(id);
  }

  // rota pública, sem autenticação — acessada pelo link com código
  @Get('codigo/:codigo')
  findByCodigo(@Param('codigo') codigo: string) {
    return this.contagensService.findByCodigo(codigo);
  }

  @Post(':id/respostas')
  submitResposta(@Param('id') id: string, @Body() dto: SubmitRespostaDto) {
    return this.contagensService.submitResposta(id, dto);
  }
}
