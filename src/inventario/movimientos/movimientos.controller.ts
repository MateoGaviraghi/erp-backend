import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MovimientosService } from './movimientos.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('inventario')
@ApiBearerAuth('JWT-auth')
@Controller('movimientos-stock')
export class MovimientosController {
  constructor(private readonly service: MovimientosService) {}

  @Get()
  @ApiOperation({ summary: 'Historial de movimientos de stock' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get('producto/:productoId')
  @ApiOperation({ summary: 'Movimientos de un producto específico' })
  findByProducto(
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findByProducto(productoId, user);
  }
}
