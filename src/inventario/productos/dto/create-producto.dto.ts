import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { TipoProducto } from '@prisma/client';

export class CreateProductoDto {
  @ApiProperty({ example: 'PROD-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code!: string;

  @ApiProperty({ example: 'Producto A - Premium' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Producto de alta calidad' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @ApiProperty({ enum: TipoProducto, example: TipoProducto.TERMINADO })
  @IsEnum(TipoProducto)
  tipo!: TipoProducto;

  @ApiProperty({ example: 'UNI', description: 'Unidad de medida' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  unit!: string;

  @ApiProperty({ example: 600.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  cost!: number;

  @ApiProperty({ example: 1000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price!: number;

  @ApiProperty({ example: 20, description: 'Stock mínimo para alertas' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minStock!: number;
}

export class UpdateProductoDto extends PartialType(CreateProductoDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
