import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class FilterUsuarioDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por nombre o email' })
  @IsOptional()
  @IsString()
  declare search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por local' })
  @IsOptional()
  @IsUUID()
  declare localId?: string;
}
