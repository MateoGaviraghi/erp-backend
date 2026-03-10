import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AsistenciasService } from './asistencias.service.js';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('rrhh')
@ApiBearerAuth('JWT-auth')
@Controller('asistencias')
export class AsistenciasController {
  constructor(private readonly service: AsistenciasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar asistencias (filtrable por empleado y fecha)',
  })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
    @Query('empleadoId') empleadoId?: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.service.findAll(user, pagination, empleadoId, fecha);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar asistencia' })
  create(@Body() dto: CreateAsistenciaDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }
}
