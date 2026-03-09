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
import { BancosService } from './bancos.service.js';
import { CreateMovimientoBancarioDto } from './dto/create-movimiento-bancario.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('finanzas')
@ApiBearerAuth('JWT-auth')
@Controller('bancos')
export class BancosController {
  constructor(private readonly service: BancosService) {}

  @Get('cuentas')
  @ApiOperation({ summary: 'Listar cuentas bancarias con saldo' })
  getCuentas(@CurrentUser() user: JwtPayload) {
    return this.service.getCuentas(user);
  }

  @Get('cuentas/:id/movimientos')
  @ApiOperation({ summary: 'Movimientos de una cuenta bancaria' })
  getMovimientos(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.service.getMovimientos(id, user, pagination);
  }

  @Post('movimientos')
  @ApiOperation({ summary: 'Registrar movimiento bancario (crédito/débito)' })
  registrarMovimiento(
    @Body() dto: CreateMovimientoBancarioDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.registrarMovimiento(dto, user);
  }
}
