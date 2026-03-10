import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BomService } from './bom.service.js';
import { CreateBomDto } from './dto/create-bom.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('produccion')
@ApiBearerAuth('JWT-auth')
@Controller('bom')
export class BomController {
  constructor(private readonly service: BomService) {}

  @Get()
  @ApiOperation({ summary: 'Listar BOMs' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'BOM con items y costo estimado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Crear BOM' })
  create(
    @Body() dto: CreateBomDto,
    @Query('localId', ParseUUIDPipe) localId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, localId, user);
  }
}
