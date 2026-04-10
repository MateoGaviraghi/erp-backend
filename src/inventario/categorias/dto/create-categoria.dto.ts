import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class CreateCategoriaDto {
  @ApiProperty({ example: 'Materia Prima' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Materiales base de producción' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

export class UpdateCategoriaDto extends PartialType(CreateCategoriaDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
