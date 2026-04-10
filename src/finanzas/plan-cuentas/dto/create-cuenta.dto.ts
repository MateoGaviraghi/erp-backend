import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsUUID,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoCuenta, NaturalezaCuenta } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCuentaDto {
  @ApiProperty({ example: '1.1.01', description: 'Código jerárquico único' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: 'Caja Principal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @ApiProperty({ enum: TipoCuenta, example: TipoCuenta.ACTIVO })
  @IsEnum(TipoCuenta)
  tipo!: TipoCuenta;

  @ApiProperty({ enum: NaturalezaCuenta })
  @IsEnum(NaturalezaCuenta)
  naturaleza!: NaturalezaCuenta;

  @ApiPropertyOptional({ default: 1, description: 'Nivel jerárquico (1=raíz)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  nivel?: number;

  @ApiPropertyOptional({
    description: 'ID de la cuenta padre (null = cuenta raíz)',
  })
  @IsOptional()
  @IsUUID()
  cuentaPadreId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  imputable?: boolean;
}
