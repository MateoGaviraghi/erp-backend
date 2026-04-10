import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AsientosService } from './asientos.service.js';
import { CreateAsientoDto } from './dto/create-asiento.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('finanzas')
@ApiBearerAuth('JWT-auth')
@Controller('asientos')
export class AsientosController {
  constructor(private readonly service: AsientosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar asientos contables (paginado)' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener asiento con detalles' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear asiento manual (guarda como BORRADOR sin validar balance)',
  })
  create(
    @Body() dto: CreateAsientoDto,
    @Query('localId', ParseUUIDPipe) localId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, localId, user);
  }

  @Patch(':id/confirmar')
  @ApiOperation({
    summary: 'Confirmar asiento (valida que DEBE = HABER antes de confirmar)',
  })
  confirmar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.confirmar(id, user);
  }

  @Patch(':id/anular')
  @ApiOperation({ summary: 'Anular asiento (BORRADOR o CONFIRMADO → ANULADO)' })
  anular(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.anular(id, user);
  }
}
