import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecepcionesService } from './recepciones.service.js';
import { CreateRecepcionDto } from './dto/create-recepcion.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('compras')
@ApiBearerAuth('JWT-auth')
@Controller('recepciones')
export class RecepcionesController {
  constructor(private readonly service: RecepcionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar recepciones de mercadería' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar recepción (incrementa stock)' })
  create(@Body() dto: CreateRecepcionDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }
}
