import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class CreateDepositoDto {
  @ApiProperty({ description: 'ID del local al que pertenece el depósito' })
  @IsUUID()
  localId!: string;

  @ApiProperty({ example: 'DEP-A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: 'Depósito Principal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Sector A, Planta Baja' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;
}

export class UpdateDepositoDto extends PartialType(CreateDepositoDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
