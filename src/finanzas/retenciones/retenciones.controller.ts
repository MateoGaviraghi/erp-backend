import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RetencionesService } from './retenciones.service.js';
import { CreateRetencionDto } from './dto/create-retencion.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('finanzas')
@ApiBearerAuth('JWT-auth')
@Controller('retenciones')
export class RetencionesController {
  constructor(private readonly service: RetencionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar retenciones impositivas' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar retención impositiva' })
  create(
    @Body() dto: CreateRetencionDto,
    @Query('localId') localId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, localId, user);
  }
}
