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
import { ProveedoresService } from './proveedores.service.js';
import {
  CreateProveedorDto,
  UpdateProveedorDto,
} from './dto/create-proveedor.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('compras')
@ApiBearerAuth('JWT-auth')
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly service: ProveedoresService) {}

  @Get()
  @ApiOperation({ summary: 'Listar proveedores' })
  findAll(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.service.findAll(user, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener proveedor por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Get(':id/deuda')
  @ApiOperation({ summary: 'Consultar deuda pendiente con proveedor' })
  getDeuda(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getDeuda(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Crear proveedor' })
  create(@Body() dto: CreateProveedorDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProveedorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user);
  }
}
