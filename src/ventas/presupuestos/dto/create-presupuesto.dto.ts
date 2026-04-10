import {
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsString,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemPresupuestoDto {
  @ApiProperty()
  @IsUUID()
  productoId!: string;

  @ApiProperty({ example: 10 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Type(() => Number)
  cantidad!: number;

  @ApiProperty({ example: 1000.0, description: 'Precio unitario de venta' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  precioUnitario!: number;

  @ApiPropertyOptional({ example: 10, description: 'Descuento en porcentaje' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  descuento?: number;
}

export class CreatePresupuestoDto {
  @ApiProperty()
  @IsUUID()
  clienteId!: string;

  @ApiPropertyOptional({
    example: '2026-04-30',
    description: 'Fecha de vencimiento del presupuesto',
  })
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiProperty({ type: [ItemPresupuestoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPresupuestoDto)
  items!: ItemPresupuestoDto[];
}
