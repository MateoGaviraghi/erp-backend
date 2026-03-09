import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateProveedorDto,
  UpdateProveedorDto,
} from './dto/create-proveedor.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
      ...(pagination.search && {
        OR: [
          {
            name: { contains: pagination.search, mode: 'insensitive' as const },
          },
          {
            code: { contains: pagination.search, mode: 'insensitive' as const },
          },
          {
            taxId: {
              contains: pagination.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.proveedor.findMany({
        where,
        include: { _count: { select: { ordenesCompra: true } } },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.proveedor.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id, empresaId: currentUser.empresaId },
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');
    return { data: proveedor };
  }

  async create(dto: CreateProveedorDto, currentUser: JwtPayload) {
    const exists = await this.prisma.proveedor.findFirst({
      where: { empresaId: currentUser.empresaId, code: dto.code },
    });
    if (exists) {
      throw new ConflictException(
        `Ya existe un proveedor con el código ${dto.code}`,
      );
    }

    const proveedor = await this.prisma.proveedor.create({
      data: { ...dto, empresaId: currentUser.empresaId },
    });
    return { data: proveedor };
  }

  async update(id: string, dto: UpdateProveedorDto, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);
    const updated = await this.prisma.proveedor.update({
      where: { id },
      data: dto,
    });
    return { data: updated };
  }

  async getDeuda(id: string, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);

    const cuentas = await this.prisma.cuentaPorPagar.findMany({
      where: {
        proveedorId: id,
        empresaId: currentUser.empresaId,
        estado: { in: ['PENDIENTE', 'PARCIAL'] as any[] },
      },
      include: { ordenCompra: { select: { id: true, numero: true } } },
    });

    const saldos = cuentas.map((c) => ({
      cuentaId: c.id,
      ordenId: c.ordenCompraId,
      ordenNumero: c.ordenCompra.numero,
      montoTotal: Number(c.montoTotal),
      montoPagado: Number(c.montoPagado),
      saldoPendiente: Number(c.montoSaldo),
      estado: c.estado,
    }));

    const totalDeuda = saldos.reduce((s, c) => s + c.saldoPendiente, 0);
    return { data: { saldos, totalDeuda } };
  }
}
