import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePedidoDto {
  @ApiProperty({
    description: 'ID del presupuesto aprobado a convertir en pedido',
  })
  @IsUUID()
  presupuestoId!: string;
}
