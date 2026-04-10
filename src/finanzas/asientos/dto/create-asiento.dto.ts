import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DetalleAsientoDto {
  @ApiProperty({ description: 'ID de la cuenta contable' })
  @IsUUID()
  cuentaId!: string;

  @ApiProperty({ example: 5000, description: 'Monto al DEBE (0 si es HABER)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  debe!: number;

  @ApiProperty({ example: 0, description: 'Monto al HABER (0 si es DEBE)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  haber!: number;

  @ApiPropertyOptional({ example: 'Cobro factura 0001-001234' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class CreateAsientoDto {
  @ApiPropertyOptional({ description: 'Fecha del asiento (default: hoy)' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiProperty({ example: 'Cobro en efectivo Factura B 0001-001234' })
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @ApiPropertyOptional({ description: 'ID de referencia (factura, OC, etc.)' })
  @IsOptional()
  @IsUUID()
  referenciaId?: string;

  @ApiProperty({ type: [DetalleAsientoDto], minItems: 2 })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleAsientoDto)
  detalles!: DetalleAsientoDto[];
}
