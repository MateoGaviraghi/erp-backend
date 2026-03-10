import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BomItemDto {
  @ApiProperty({ description: 'ID del MaterialProduccion' })
  @IsUUID()
  materialId: string;

  @ApiProperty({
    example: 2.5,
    description: 'Cantidad requerida por lote producido',
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  @Type(() => Number)
  cantidad: number;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unidad?: string;
}

export class CreateBomDto {
  @ApiProperty({ example: 'BOM-SILLA-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'ID del producto terminado que se fabrica' })
  @IsUUID()
  productoId: string;

  @ApiProperty({ example: 1, description: 'Cantidad producida por lote' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Type(() => Number)
  cantidad: number;

  @ApiProperty({ example: 'UNI' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unidad: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  version?: number;

  @ApiProperty({ type: [BomItemDto], minItems: 1 })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomItemDto)
  items: BomItemDto[];
}
