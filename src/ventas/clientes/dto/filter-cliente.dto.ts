import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class FilterClienteDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por activo/inactivo' })
  @IsOptional()
  declare active?: boolean;
}
