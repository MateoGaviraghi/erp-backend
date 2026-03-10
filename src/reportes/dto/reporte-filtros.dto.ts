import {
  IsOptional,
  IsDateString,
  IsUUID,
  IsEnum,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum FormatoReporte {
  JSON = 'json',
  XLSX = 'xlsx',
}

export class ReporteFiltrosDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  localId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empleadoId?: string;

  @ApiPropertyOptional({ enum: FormatoReporte, default: FormatoReporte.JSON })
  @IsOptional()
  @IsEnum(FormatoReporte)
  formato?: FormatoReporte;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agrupacion?: string;
}
