import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateCotacaoDto {
  @IsString()
  @IsNotEmpty()
  insumoId: string;

  @IsString()
  @IsNotEmpty()
  fornecedor: string;

  @IsNumber()
  @Min(0.01)
  preco: number;
}
