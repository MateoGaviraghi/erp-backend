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
import { OrdenesService } from './ordenes.service.js';
import { CreateOrdenCompraDto } from './dto/create-orden.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('compras')
@ApiBearerAuth('JWT-auth')
@Controller('ordenes-compra')
export class OrdenesController {
  constructor(private readonly service: OrdenesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener orden de compra por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Crear orden de compra' })
  create(
    @Body() dto: CreateOrdenCompraDto,
    @Query('localId', ParseUUIDPipe) localId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, localId, user);
  }

  @Patch(':id/aprobar')
  @ApiOperation({ summary: 'Aprobar orden de compra (BORRADOR → ENVIADA)' })
  aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.aprobar(id, user);
  }
}
