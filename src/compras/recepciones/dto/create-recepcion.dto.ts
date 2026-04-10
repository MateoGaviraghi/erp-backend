import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemRecepcionDto {
  @ApiProperty({ description: 'ID del item de la orden de compra' })
  @IsUUID()
  itemOrdenCompraId!: string;

  @ApiProperty({ example: 50, description: 'Cantidad efectivamente recibida' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Type(() => Number)
  cantidadRecibida!: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Cantidad rechazada (defectos)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  cantidadRechazada?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivoRechazo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateRecepcionDto {
  @ApiProperty({ description: 'ID de la orden de compra' })
  @IsUUID()
  ordenCompraId!: string;

  @ApiPropertyOptional({
    example: '0001-00012345',
    description: 'Número de remito del proveedor',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nroRemito?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ type: [ItemRecepcionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemRecepcionDto)
  items!: ItemRecepcionDto[];
}
