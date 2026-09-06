import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInstanciaDto {
  // formato YYYY-MM-DD, precisa cair num domingo
  @IsDateString()
  dataReferencia: string;
}

export class SubmitRespostaDto {
  @IsString()
  @IsNotEmpty()
  insumoId: string;

  @IsNumber()
  @Min(0)
  valor: number;

  @IsOptional()
  @IsBoolean()
  confirmar?: boolean;
}
