import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VacacionesService } from './vacaciones.service.js';
import { CreateVacacionDto } from './dto/create-vacacion.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('rrhh')
@ApiBearerAuth('JWT-auth')
@Controller('vacaciones')
export class VacacionesController {
  constructor(private readonly service: VacacionesService) {}

  @Get('empleado/:id')
  @ApiOperation({ summary: 'Historial de vacaciones de un empleado' })
  findByEmpleado(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findByEmpleado(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Solicitar vacaciones' })
  create(@Body() dto: CreateVacacionDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Patch(':id/aprobar')
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Aprobar solicitud de vacaciones [Admin]' })
  aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.aprobar(id, user);
  }

  @Patch(':id/rechazar')
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Rechazar solicitud de vacaciones [Admin]' })
  rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.rechazar(id, motivo, user);
  }
}
