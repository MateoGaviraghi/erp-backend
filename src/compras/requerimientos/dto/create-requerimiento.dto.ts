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

export class ItemRequerimientoDto {
  @ApiPropertyOptional({ description: 'ID del producto (opcional)' })
  @IsOptional()
  @IsUUID()
  productoId?: string;

  @ApiProperty({ example: 'Tornillos M8 x 30mm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descripcion: string;

  @ApiProperty({ example: 100 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Type(() => Number)
  cantidad: number;

  @ApiProperty({ example: 'KG' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unidad: string;

  @ApiPropertyOptional({ example: 250.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  precioEstimado?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CreateRequerimientoDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  solicitante: string;

  @ApiProperty({ example: 'Producción' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  departamento: string;

  @ApiProperty({ example: 'Reposición de insumos para la producción de marzo' })
  @IsString()
  @IsNotEmpty()
  justificacion: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  fechaNecesidad: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({ type: [ItemRequerimientoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemRequerimientoDto)
  items: ItemRequerimientoDto[];
}
