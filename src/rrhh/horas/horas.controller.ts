import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HorasService } from './horas.service.js';
import { CreateRegistroHorasDto } from './dto/create-horas.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('rrhh')
@ApiBearerAuth('JWT-auth')
@Controller('horas')
export class HorasController {
  constructor(private readonly service: HorasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros de horas' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
    @Query('empleadoId') empleadoId?: string,
  ) {
    return this.service.findAll(user, pagination, empleadoId);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar horas trabajadas' })
  create(@Body() dto: CreateRegistroHorasDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }
}
