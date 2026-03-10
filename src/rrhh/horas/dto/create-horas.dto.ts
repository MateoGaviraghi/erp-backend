import {
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegistroHorasDto {
  @ApiProperty()
  @IsUUID()
  empleadoId: string;

  @ApiProperty({ example: '2026-02-18' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: 8 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  horasNormales: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  horasExtra?: number;

  @ApiPropertyOptional({ example: 'Cierre de mes' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
