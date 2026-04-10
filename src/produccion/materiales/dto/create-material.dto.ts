import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoProducto } from '@prisma/client';

export class CreateMaterialProduccionDto {
  @ApiProperty({ example: 'MAT-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: 'Chapa de acero 1mm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @ApiProperty({ enum: TipoProducto, example: 'MATERIA_PRIMA' })
  @IsEnum(TipoProducto)
  tipo!: TipoProducto;

  @ApiProperty({ example: 'kg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unidad!: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  stockActual?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  stockMinimo?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  stockMaximo?: number;

  @ApiPropertyOptional({ example: 250.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  costoUnitario?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  proveedorId?: string;
}

export class UpdateMaterialProduccionDto extends PartialType(
  CreateMaterialProduccionDto,
) {}
