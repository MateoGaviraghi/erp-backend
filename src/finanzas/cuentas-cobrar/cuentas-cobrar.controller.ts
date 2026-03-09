import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CuentasCobrarService } from './cuentas-cobrar.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('finanzas')
@ApiBearerAuth('JWT-auth')
@Controller('cuentas-cobrar')
export class CuentasCobrarController {
  constructor(private readonly service: CuentasCobrarService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cuentas por cobrar (paginado)' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen CxC agrupado por estado/vencimiento' })
  getResumen(@CurrentUser() user: JwtPayload) {
    return this.service.getResumen(user);
  }
}
