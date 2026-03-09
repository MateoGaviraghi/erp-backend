import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoProducto } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';
import { Type } from 'class-transformer';

export class FilterProductoDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TipoProducto })
  @IsOptional()
  @IsEnum(TipoProducto)
  tipo?: TipoProducto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiPropertyOptional({ description: 'true = solo productos con stock bajo' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  stockBajo?: boolean;
}
