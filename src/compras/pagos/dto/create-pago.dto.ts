import {
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePagoProveedorDto {
  @ApiProperty({ description: 'ID del proveedor' })
  @IsUUID()
  proveedorId: string;

  @ApiProperty({ example: 45000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  monto: number;

  @ApiProperty({ example: 'TRANSFERENCIA' })
  @IsString()
  @IsNotEmpty()
  metodoPago: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ example: 'CBU 000001234567' })
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiPropertyOptional({ description: 'ID de la Cuenta por Pagar a imputar' })
  @IsOptional()
  @IsUUID()
  cuentaPagarId?: string;
}
