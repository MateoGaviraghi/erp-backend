import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PagosService } from './pagos.service.js';
import { CreatePagoProveedorDto } from './dto/create-pago.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('compras')
@ApiBearerAuth('JWT-auth')
@Controller('pagos-proveedor')
export class PagosController {
  constructor(private readonly service: PagosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pagos a proveedores' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar pago a proveedor' })
  create(@Body() dto: CreatePagoProveedorDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }
}
