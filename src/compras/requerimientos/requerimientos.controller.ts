import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequerimientosService } from './requerimientos.service.js';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('compras')
@ApiBearerAuth('JWT-auth')
@Controller('requerimientos')
export class RequerimientosController {
  constructor(private readonly service: RequerimientosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar requerimientos de compra' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener requerimiento por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Crear requerimiento de compra' })
  create(
    @Body() dto: CreateRequerimientoDto,
    @Query('localId', ParseUUIDPipe) localId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, localId, user);
  }

  @Patch(':id/autorizar')
  @ApiOperation({
    summary: 'Autorizar requerimiento (cambia estado a AUTORIZADO)',
  })
  autorizar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.autorizar(id, user);
  }
}
