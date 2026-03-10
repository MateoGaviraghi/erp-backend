import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateLiquidacionDto } from './dto/create-liquidacion.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class LiquidacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { empleado: { localId: pagination.localId } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.liquidacion.findMany({
        where,
        include: {
          empleado: {
            select: { id: true, code: true, name: true, position: true },
          },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.liquidacion.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const liq = await this.prisma.liquidacion.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        empleado: {
          select: {
            code: true,
            name: true,
            position: true,
            department: true,
          },
        },
      },
    });
    if (!liq) throw new NotFoundException('Liquidación no encontrada');
    return { data: liq };
  }

  async create(dto: CreateLiquidacionDto, currentUser: JwtPayload) {
    const empleado = await this.prisma.empleado.findFirst({
      where: { id: dto.empleadoId, empresaId: currentUser.empresaId },
    });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    const existe = await this.prisma.liquidacion.findFirst({
      where: { empleadoId: dto.empleadoId, periodo: dto.periodo },
    });
    if (existe)
      throw new BadRequestException(
        'Ya existe una liquidación para este empleado en el período indicado',
      );

    const deducciones = dto.deducciones ?? 0;
    const sueldoNeto = dto.sueldobruto - deducciones;

    const liquidacion = await this.prisma.liquidacion.create({
      data: {
        empresaId: currentUser.empresaId,
        empleadoId: dto.empleadoId,
        periodo: dto.periodo,
        sueldobruto: dto.sueldobruto,
        deducciones,
        sueldoNeto,
        notas: dto.notas,
        ...(dto.fechaPago && { fechaPago: new Date(dto.fechaPago) }),
      },
      include: {
        empleado: { select: { code: true, name: true } },
      },
    });

    return { data: liquidacion };
  }

  async aprobar(id: string, currentUser: JwtPayload) {
    const liq = await this.prisma.liquidacion.findFirst({
      where: { id, empresaId: currentUser.empresaId, estado: 'BORRADOR' },
    });
    if (!liq)
      throw new NotFoundException('Liquidación no encontrada o ya aprobada');

    const updated = await this.prisma.liquidacion.update({
      where: { id },
      data: { estado: 'APROBADA' },
    });
    return { data: updated };
  }
}
