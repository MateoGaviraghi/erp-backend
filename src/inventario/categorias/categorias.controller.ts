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
import { CategoriasService } from './categorias.service.js';
import {
  CreateCategoriaDto,
  UpdateCategoriaDto,
} from './dto/create-categoria.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('categorias')
@ApiBearerAuth('JWT-auth')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly service: CategoriasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías de la empresa' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener categoría por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Crear categoría [Admin]' })
  create(@Body() dto: CreateCategoriaDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Actualizar categoría [Admin]' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoriaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user);
  }
}
