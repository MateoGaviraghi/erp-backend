import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoPresupuesto } from '@prisma/client';

export class EstadoPresupuestoDto {
  @ApiProperty({ enum: EstadoPresupuesto })
  @IsEnum(EstadoPresupuesto)
  estado: EstadoPresupuesto;
}
