import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateInsumoDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;
}
