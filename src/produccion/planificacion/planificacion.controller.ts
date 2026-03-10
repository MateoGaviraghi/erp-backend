import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlanificacionService } from './planificacion.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('produccion')
@ApiBearerAuth('JWT-auth')
@Controller('planificacion')
export class PlanificacionController {
  constructor(private readonly service: PlanificacionService) {}

  @Get()
  @ApiOperation({ summary: 'Calendario de órdenes por período' })
  getCalendario(
    @CurrentUser() user: JwtPayload,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.service.getCalendario(user, desde, hasta);
  }

  @Get('materiales')
  @ApiOperation({
    summary: 'Verificar stock de materiales vs demanda planificada',
  })
  verificarMateriales(@CurrentUser() user: JwtPayload) {
    return this.service.verificarMateriales(user);
  }
}
