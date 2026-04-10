import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemOrdenCompraDto {
  @ApiPropertyOptional({ description: 'ID del producto en sistema (opcional)' })
  @IsOptional()
  @IsUUID()
  productoId?: string;

  @ApiProperty({ example: 'Tornillos M8 x 30mm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descripcion!: string;

  @ApiProperty({ example: 100 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Type(() => Number)
  cantidad!: number;

  @ApiProperty({ example: 'KG' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unidad!: string;

  @ApiProperty({ example: 450.0, description: 'Precio unitario de compra' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  precioUnitario!: number;

  @ApiPropertyOptional({ example: 0, description: 'Descuento en %' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  descuento?: number;
}

export class CreateOrdenCompraDto {
  @ApiProperty({ description: 'ID del proveedor seleccionado' })
  @IsUUID()
  proveedorId!: string;

  @ApiPropertyOptional({
    description: 'ID del requerimiento origen (opcional)',
  })
  @IsOptional()
  @IsUUID()
  requerimientoId?: string;

  @ApiPropertyOptional({ example: '2026-04-15' })
  @IsOptional()
  @IsDateString()
  fechaEntregaEstimada?: string;

  @ApiPropertyOptional({ example: '30 días neto' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  condicionesPago?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ type: [ItemOrdenCompraDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemOrdenCompraDto)
  items!: ItemOrdenCompraDto[];
}
