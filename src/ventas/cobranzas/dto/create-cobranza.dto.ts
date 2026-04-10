import {
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCobranzaDto {
  @ApiProperty()
  @IsUUID()
  facturaId!: string;

  @ApiProperty({ example: 5000.0, description: 'Monto cobrado' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  monto!: number;

  @ApiProperty({
    example: 'TRANSFERENCIA',
    description:
      'Método de pago (EFECTIVO, TRANSFERENCIA, CHEQUE, TARJETA, etc.)',
  })
  @IsString()
  @MaxLength(50)
  metodoPago!: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ example: 'Cheque Nro 12345' })
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;
}
