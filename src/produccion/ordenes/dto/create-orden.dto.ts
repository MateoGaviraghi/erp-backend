import {
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrdenProduccionDto {
  @ApiProperty({ description: 'ID del BOM a utilizar' })
  @IsUUID()
  bomId!: string;

  @ApiProperty({ example: 50, description: 'Cantidad de unidades a producir' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Type(() => Number)
  cantidadPlanificada!: number;

  @ApiProperty({
    example: '2026-12-31',
    description: 'Fecha estimada de finalización',
  })
  @IsDateString()
  fechaFinPlanificada!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  operador?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  costoManoObra?: number;
}

export class FinalizarOrdenDto {
  @ApiProperty({ example: 48 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Type(() => Number)
  cantidadRealizada!: number;
}

export class CancelarOrdenDto {
  @ApiProperty({ example: 'Falta de materiales' })
  @IsString()
  motivo!: string;
}
