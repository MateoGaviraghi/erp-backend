import {
  IsUUID,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLiquidacionDto {
  @ApiProperty()
  @IsUUID()
  empleadoId!: string;

  @ApiProperty({
    example: '2026-02',
    description: 'Período en formato YYYY-MM',
  })
  @IsString()
  @IsNotEmpty()
  periodo!: string;

  @ApiProperty({ example: 280000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  sueldobruto!: number;

  @ApiPropertyOptional({ example: 39480 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  deducciones?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaPago?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}
