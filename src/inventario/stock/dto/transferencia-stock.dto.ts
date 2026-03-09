import { IsUUID, IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferenciaStockDto {
  @ApiProperty({ description: 'ID del producto a transferir' })
  @IsUUID()
  productoId: string;

  @ApiProperty({ description: 'ID del local destino' })
  @IsUUID()
  localDestinoId: string;

  @ApiProperty({ example: 20 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Type(() => Number)
  cantidad: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}
