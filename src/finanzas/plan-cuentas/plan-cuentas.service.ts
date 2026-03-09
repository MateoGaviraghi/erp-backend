import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCuentaDto } from './dto/create-cuenta.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class PlanCuentasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload) {
    const cuentas = await this.prisma.cuentaContable.findMany({
      where: { empresaId: currentUser.empresaId },
      include: {
        subcuentas: {
          include: { subcuentas: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    const raices = cuentas.filter((c) => !c.cuentaPadreId);
    return { data: raices };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const cuenta = await this.prisma.cuentaContable.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        cuentaPadre: { select: { code: true, nombre: true } },
        subcuentas: { select: { id: true, code: true, nombre: true } },
        _count: { select: { detalles: true } },
      },
    });
    if (!cuenta) throw new NotFoundException('Cuenta contable no encontrada');
    return { data: cuenta };
  }

  async create(dto: CreateCuentaDto, currentUser: JwtPayload) {
    const exists = await this.prisma.cuentaContable.findFirst({
      where: { empresaId: currentUser.empresaId, code: dto.code },
    });
    if (exists)
      throw new ConflictException(
        `Ya existe una cuenta con el código ${dto.code}`,
      );

    let nivel = dto.nivel ?? 1;

    if (dto.cuentaPadreId) {
      const parent = await this.prisma.cuentaContable.findFirst({
        where: { id: dto.cuentaPadreId, empresaId: currentUser.empresaId },
      });
      if (!parent) throw new NotFoundException('Cuenta padre no encontrada');
      if (parent.imputable) {
        throw new BadRequestException(
          'No se puede agregar subcuentas a una cuenta imputable',
        );
      }
      nivel = parent.nivel + 1;
    }

    const cuenta = await this.prisma.cuentaContable.create({
      data: {
        code: dto.code,
        nombre: dto.nombre,
        tipo: dto.tipo,
        naturaleza: dto.naturaleza,
        nivel,
        cuentaPadreId: dto.cuentaPadreId,
        imputable: dto.imputable ?? true,
        empresaId: currentUser.empresaId,
      },
    });
    return { data: cuenta };
  }

  async getMayor(
    id: string,
    currentUser: JwtPayload,
    desde?: string,
    hasta?: string,
  ) {
    const cuenta = await this.prisma.cuentaContable.findFirst({
      where: { id, empresaId: currentUser.empresaId },
    });
    if (!cuenta) throw new NotFoundException('Cuenta no encontrada');

    const detalles = await this.prisma.detalleAsiento.findMany({
      where: {
        cuentaId: id,
        asiento: {
          empresaId: currentUser.empresaId,
          ...(desde || hasta
            ? {
                fecha: {
                  ...(desde && { gte: new Date(desde) }),
                  ...(hasta && { lte: new Date(hasta) }),
                },
              }
            : {}),
        },
      },
      include: {
        asiento: {
          select: { id: true, numero: true, fecha: true, descripcion: true },
        },
      },
      orderBy: { asiento: { fecha: 'asc' } },
    });

    let saldo = 0;
    const movimientos = detalles.map((d) => {
      const debe = Number(d.debe);
      const haber = Number(d.haber);
      if (cuenta.naturaleza === 'DEUDORA') {
        saldo += debe - haber;
      } else {
        saldo += haber - debe;
      }
      return { ...d, saldoAcumulado: saldo };
    });

    const totalDebe = detalles.reduce((s, d) => s + Number(d.debe), 0);
    const totalHaber = detalles.reduce((s, d) => s + Number(d.haber), 0);

    return {
      data: {
        cuenta: {
          code: cuenta.code,
          nombre: cuenta.nombre,
          naturaleza: cuenta.naturaleza,
        },
        movimientos,
        totales: { debe: totalDebe, haber: totalHaber, saldoFinal: saldo },
      },
    };
  }
}
