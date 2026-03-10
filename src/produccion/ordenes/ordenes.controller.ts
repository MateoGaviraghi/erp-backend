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
import { OrdenesProduccionService } from './ordenes.service.js';
import {
  CreateOrdenProduccionDto,
  FinalizarOrdenDto,
  CancelarOrdenDto,
} from './dto/create-orden.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('produccion')
@ApiBearerAuth('JWT-auth')
@Controller('ordenes-produccion')
export class OrdenesController {
  constructor(private readonly service: OrdenesProduccionService) {}

  @Get()
  @ApiOperation({ summary: 'Listar órdenes de producción' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Orden de producción con materiales requeridos' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Crear orden de producción' })
  create(
    @Body() dto: CreateOrdenProduccionDto,
    @Query('localId', ParseUUIDPipe) localId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, localId, user);
  }

  @Patch(':id/iniciar')
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Iniciar orden → descuenta materiales' })
  iniciar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.iniciar(id, user);
  }

  @Patch(':id/finalizar')
  @Roles(UserRole.Administrador)
  @ApiOperation({
    summary: 'Finalizar orden → ingresa producto terminado al stock',
  })
  finalizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinalizarOrdenDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.finalizar(id, dto, user);
  }

  @Patch(':id/cancelar')
  @Roles(UserRole.Administrador)
  @ApiOperation({
    summary: 'Cancelar orden → reintegra materiales si EN_PROCESO',
  })
  cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelarOrdenDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.cancelar(id, dto, user);
  }
}
