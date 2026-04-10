import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAsistenciaDto {
  @ApiProperty({ description: 'ID del empleado' })
  @IsUUID()
  empleadoId!: string;

  @ApiProperty({ example: '2026-02-18' })
  @IsDateString()
  fecha!: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  ausente?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  justificado?: boolean;

  @ApiPropertyOptional({ example: '2026-02-18T09:05:00Z' })
  @IsOptional()
  @IsString()
  entrada?: string;

  @ApiPropertyOptional({ example: '2026-02-18T18:05:00Z' })
  @IsOptional()
  @IsString()
  salida?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}
