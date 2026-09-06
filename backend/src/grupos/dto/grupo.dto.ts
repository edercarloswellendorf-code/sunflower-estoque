import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateGrupoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;
}

export class UpdateGrupoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;
}

export class AssignInsumoDto {
  @IsString()
  @IsNotEmpty()
  insumoId: string;
}

export class ReorderGrupoDto {
  // lista de insumoIds na ordem física desejada
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  insumoIds: string[];
}
