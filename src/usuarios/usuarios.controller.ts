import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { FilterUsuarioDto } from './dto/filter-usuario.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('usuarios')
@ApiBearerAuth('JWT-auth')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Roles(UserRole.Administrador)
  @Get()
  @ApiOperation({
    summary: 'Listar usuarios de la empresa (solo Administrador)',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios con paginación' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: FilterUsuarioDto,
  ) {
    return this.usuariosService.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.findOne(id, user);
  }

  @Roles(UserRole.Administrador)
  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario (solo Administrador)' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  create(@Body() dto: CreateUsuarioDto, @CurrentUser() user: JwtPayload) {
    return this.usuariosService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de usuario' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.update(id, dto, user);
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña de usuario' })
  changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('password') password: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usuariosService.changePassword(id, password, user);
  }
}
