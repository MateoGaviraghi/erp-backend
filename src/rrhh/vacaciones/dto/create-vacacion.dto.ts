import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVacacionDto {
  @ApiProperty()
  @IsUUID()
  empleadoId!: string;

  @ApiProperty({ example: '2026-07-07' })
  @IsDateString()
  fechaDesde!: string;

  @ApiProperty({ example: '2026-07-18' })
  @IsDateString()
  fechaHasta!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}
