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
import { EmpleadosService } from './empleados.service.js';
import {
  CreateEmpleadoDto,
  UpdateEmpleadoDto,
} from './dto/create-empleado.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('rrhh')
@ApiBearerAuth('JWT-auth')
@Controller('empleados')
export class EmpleadosController {
  constructor(private readonly service: EmpleadosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar empleados' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Legajo completo del empleado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Get(':id/resumen-horas')
  @ApiOperation({ summary: 'Resumen de horas y asistencias de un mes' })
  getResumenHoras(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('mes') mes: string,
    @Query('anio') anio: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getResumenHoras(id, +mes, +anio, user);
  }

  @Post()
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Crear empleado [Admin]' })
  create(
    @Body() dto: CreateEmpleadoDto,
    @CurrentUser() user: JwtPayload,
    @Query('localId', ParseUUIDPipe) localId: string,
  ) {
    return this.service.create(dto, localId, user);
  }

  @Patch(':id')
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Actualizar datos de empleado [Admin]' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmpleadoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user);
  }
}
