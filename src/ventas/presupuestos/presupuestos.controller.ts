import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PresupuestosService } from './presupuestos.service.js';
import { CreatePresupuestoDto } from './dto/create-presupuesto.dto.js';
import { EstadoPresupuestoDto } from './dto/estado-presupuesto.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('ventas')
@ApiBearerAuth('JWT-auth')
@Controller('presupuestos')
export class PresupuestosController {
  constructor(private readonly service: PresupuestosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar presupuestos' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener presupuesto con items' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Crear presupuesto' })
  create(
    @Body() dto: CreatePresupuestoDto,
    @CurrentUser() user: JwtPayload,
    @Query('localId', ParseUUIDPipe) localId: string,
  ) {
    return this.service.create(dto, localId, user);
  }

  @Post(':id/convertir-pedido')
  @ApiOperation({ summary: 'Convertir presupuesto a pedido' })
  convertirAPedido(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.convertirAPedido(id, user);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado del presupuesto' })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EstadoPresupuestoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.cambiarEstado(id, dto.estado, user);
  }
}
