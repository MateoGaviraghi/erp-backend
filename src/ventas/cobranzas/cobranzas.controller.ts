import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CobranzasService } from './cobranzas.service.js';
import { CreateCobranzaDto } from './dto/create-cobranza.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('ventas')
@ApiBearerAuth('JWT-auth')
@Controller('cobranzas')
export class CobranzasController {
  constructor(private readonly service: CobranzasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cobranzas' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar cobranza' })
  create(@Body() dto: CreateCobranzaDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }
}
