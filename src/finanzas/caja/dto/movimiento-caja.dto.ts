import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MovimientoCajaDto {
  @ApiProperty({ enum: ['INGRESO', 'EGRESO'], example: 'INGRESO' })
  @IsString()
  @IsIn(['INGRESO', 'EGRESO'])
  tipo!: string;

  @ApiProperty({ example: 5000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  monto!: number;

  @ApiProperty({ example: 'Cobro efectivo factura 0001-000456' })
  @IsString()
  @IsNotEmpty()
  concepto!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referencia?: string;
}
