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
import { LiquidacionesService } from './liquidaciones.service.js';
import { CreateLiquidacionDto } from './dto/create-liquidacion.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('rrhh')
@ApiBearerAuth('JWT-auth')
@Controller('liquidaciones')
export class LiquidacionesController {
  constructor(private readonly service: LiquidacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar liquidaciones de haberes' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener liquidación detallada' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Crear liquidación de haberes [Admin]' })
  create(@Body() dto: CreateLiquidacionDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Patch(':id/aprobar')
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Aprobar liquidación [Admin]' })
  aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.aprobar(id, user);
  }
}
