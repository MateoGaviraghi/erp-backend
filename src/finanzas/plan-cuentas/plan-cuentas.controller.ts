import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PlanCuentasService } from './plan-cuentas.service.js';
import { CreateCuentaDto } from './dto/create-cuenta.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('finanzas')
@ApiBearerAuth('JWT-auth')
@Controller('plan-cuentas')
export class PlanCuentasController {
  constructor(private readonly service: PlanCuentasService) {}

  @Get()
  @ApiOperation({ summary: 'Árbol completo del plan de cuentas' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cuenta contable por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cuenta contable' })
  create(@Body() dto: CreateCuentaDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Get(':id/mayor')
  @ApiOperation({ summary: 'Mayor contable de una cuenta' })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  getMayor(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.getMayor(id, user, desde, hasta);
  }
}
