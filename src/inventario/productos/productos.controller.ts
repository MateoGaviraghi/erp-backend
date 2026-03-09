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
import { ProductosService } from './productos.service.js';
import {
  CreateProductoDto,
  UpdateProductoDto,
} from './dto/create-producto.dto.js';
import { FilterProductoDto } from './dto/filter-producto.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('productos')
@ApiBearerAuth('JWT-auth')
@Controller('productos')
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos con stock' })
  findAll(@CurrentUser() user: JwtPayload, @Query() filter: FilterProductoDto) {
    return this.service.findAll(user, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto con stock por local' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Crear producto [Admin]' })
  create(@Body() dto: CreateProductoDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Actualizar producto [Admin]' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user);
  }
}
