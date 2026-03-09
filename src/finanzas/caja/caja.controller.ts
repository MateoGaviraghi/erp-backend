import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CajaService } from './caja.service.js';
import { MovimientoCajaDto } from './dto/movimiento-caja.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('finanzas')
@ApiBearerAuth('JWT-auth')
@Controller('caja')
export class CajaController {
  constructor(private readonly service: CajaService) {}

  @Get(':localId')
  @ApiOperation({ summary: 'Obtener saldo actual de la caja del local' })
  getSaldo(
    @Param('localId', ParseUUIDPipe) localId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getSaldo(localId, user);
  }

  @Get(':localId/movimientos')
  @ApiOperation({ summary: 'Movimientos de caja del local' })
  getMovimientos(
    @Param('localId', ParseUUIDPipe) localId: string,
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.getMovimientos(localId, user, pagination);
  }

  @Post(':localId/movimiento')
  @ApiOperation({ summary: 'Registrar movimiento de caja (ingreso/egreso)' })
  registrarMovimiento(
    @Param('localId', ParseUUIDPipe) localId: string,
    @Body() dto: MovimientoCajaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.registrarMovimiento(localId, dto, user);
  }
}
