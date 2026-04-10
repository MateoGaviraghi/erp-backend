import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MaxLength,
  IsUUID,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({ example: 'PROV-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: 'Distribuidora del Sur S.A.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'ID del local al que pertenece' })
  @IsUUID()
  localId!: string;

  @ApiPropertyOptional({ example: '30-22222222-2' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  taxId?: string;

  @ApiPropertyOptional({ example: 'compras@proveedor.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: 30, description: 'Días de pago acordados' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  paymentTerms?: number;
}

export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  declare active?: boolean;
}
