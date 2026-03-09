import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FacturasService } from './facturas.service.js';
import { CreateFacturaDto } from './dto/create-factura.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('ventas')
@ApiBearerAuth('JWT-auth')
@Controller('facturas')
export class FacturasController {
  constructor(private readonly service: FacturasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar facturas' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener factura con saldo pendiente' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post('desde-pedido')
  @ApiOperation({ summary: 'Generar factura desde pedido (descuenta stock)' })
  createFromPedido(
    @Body() dto: CreateFacturaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createFromPedido(dto, user);
  }

  @Delete(':id/anular')
  @ApiOperation({ summary: 'Anular factura (revierte stock)' })
  anular(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.anular(id, motivo, user);
  }
}
