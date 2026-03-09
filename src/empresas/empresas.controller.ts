import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { EmpresasService } from './empresas.service.js';
import {
  CreateEmpresaDto,
  UpdateEmpresaDto,
} from './dto/create-empresa.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('empresas')
@ApiBearerAuth('JWT-auth')
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly service: EmpresasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener empresa por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Crear empresa [Admin]' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateEmpresaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Actualizar empresa [Admin]' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmpresaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user);
  }
}
