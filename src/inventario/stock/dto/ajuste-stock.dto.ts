import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsUUID,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoAjuste {
  POSITIVO = 'AJUSTE_POSITIVO',
  NEGATIVO = 'AJUSTE_NEGATIVO',
}

export class AjusteStockDto {
  @ApiProperty({ description: 'ID del producto a ajustar' })
  @IsUUID()
  productoId: string;

  @ApiProperty({ enum: TipoAjuste })
  @IsEnum(TipoAjuste)
  tipo: TipoAjuste;

  @ApiProperty({
    example: 10,
    description: 'Cantidad a ajustar (siempre positiva)',
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Type(() => Number)
  cantidad: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  depositoId?: string;

  @ApiProperty({ example: 'Corrección de conteo físico' })
  @IsString()
  @IsNotEmpty()
  observaciones: string;
}
