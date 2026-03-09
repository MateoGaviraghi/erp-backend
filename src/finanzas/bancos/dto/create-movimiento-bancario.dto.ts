import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovimientoBancarioDto {
  @ApiProperty({ description: 'ID de la cuenta bancaria' })
  @IsUUID()
  cuentaBancariaId: string;

  @ApiProperty({ enum: ['CREDITO', 'DEBITO'], example: 'CREDITO' })
  @IsString()
  @IsIn(['CREDITO', 'DEBITO'])
  tipo: string;

  @ApiProperty({ example: 10000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  monto: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiProperty({ example: 'Cobro cliente X' })
  @IsString()
  @IsNotEmpty()
  concepto: string;

  @ApiPropertyOptional({ example: '000001234567' })
  @IsOptional()
  @IsString()
  referencia?: string;
}
