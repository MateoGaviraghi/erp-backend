import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoRetencion } from '@prisma/client';

export class CreateRetencionDto {
  @ApiProperty({ enum: TipoRetencion })
  @IsEnum(TipoRetencion)
  tipo!: TipoRetencion;

  @ApiProperty({ example: '0001-00001234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  numero!: string;

  @ApiPropertyOptional({ description: 'Fecha de la retención (default: hoy)' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ example: 'Proveedor S.A.' })
  @IsOptional()
  @IsString()
  proveedorNombre?: string;

  @ApiPropertyOptional({ example: 'Cliente S.R.L.' })
  @IsOptional()
  @IsString()
  clienteNombre?: string;

  @ApiProperty({ example: 1000.0, description: 'Importe retenido' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  importe!: number;

  @ApiProperty({ example: 3.5, description: 'Alícuota aplicada (%)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  alicuota!: number;

  @ApiProperty({ example: 28571.43, description: 'Base imponible' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  baseImponible!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;
}
