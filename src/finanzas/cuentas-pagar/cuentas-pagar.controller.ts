import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CuentasPagarService } from './cuentas-pagar.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('finanzas')
@ApiBearerAuth('JWT-auth')
@Controller('cuentas-pagar')
export class CuentasPagarController {
  constructor(private readonly service: CuentasPagarService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cuentas por pagar (paginado)' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen CxP agrupado por estado/vencimiento' })
  getResumen(@CurrentUser() user: JwtPayload) {
    return this.service.getResumen(user);
  }
}
