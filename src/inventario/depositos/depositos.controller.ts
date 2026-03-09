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
import { DepositosService } from './depositos.service.js';
import {
  CreateDepositoDto,
  UpdateDepositoDto,
} from './dto/create-deposito.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('depositos')
@ApiBearerAuth('JWT-auth')
@Controller('depositos')
export class DepositosController {
  constructor(private readonly service: DepositosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar depósitos (filtrar por localId)' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener depósito por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Crear depósito [Admin]' })
  create(@Body() dto: CreateDepositoDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Actualizar depósito [Admin]' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepositoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user);
  }
}
