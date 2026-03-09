import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateClienteDto,
  UpdateClienteDto,
} from './dto/create-cliente.dto.js';
import { FilterClienteDto } from './dto/filter-cliente.dto.js';
import { buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, filter: FilterClienteDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(filter.localId && { localId: filter.localId }),
      ...(filter.active !== undefined && { active: filter.active }),
      ...(filter.search && {
        OR: [
          { name: { contains: filter.search } },
          { code: { contains: filter.search } },
          { taxId: { contains: filter.search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        skip: filter.skip,
        take: filter.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return { data, meta: buildMeta(total, filter) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, empresaId: currentUser.empresaId },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return { data: cliente };
  }

  async create(dto: CreateClienteDto, currentUser: JwtPayload) {
    const exists = await this.prisma.cliente.findFirst({
      where: { empresaId: currentUser.empresaId, code: dto.code },
    });
    if (exists)
      throw new ConflictException(
        `Ya existe un cliente con código "${dto.code}"`,
      );

    const cliente = await this.prisma.cliente.create({
      data: {
        empresaId: currentUser.empresaId,
        localId: dto.localId,
        code: dto.code,
        name: dto.name,
        taxId: dto.taxId,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        email: dto.email,
        phone: dto.phone,
        creditLimit: dto.creditLimit ?? 0,
      },
    });

    return { data: cliente };
  }

  async update(id: string, dto: UpdateClienteDto, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);

    const cliente = await this.prisma.cliente.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code }),
        ...(dto.name && { name: dto.name }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.creditLimit !== undefined && { creditLimit: dto.creditLimit }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });

    return { data: cliente };
  }

  async getSaldos(clienteId: string, currentUser: JwtPayload) {
    await this.findOne(clienteId, currentUser);

    const facturas = await this.prisma.factura.findMany({
      where: {
        clienteId,
        empresaId: currentUser.empresaId,
        estado: { in: ['PENDIENTE', 'PARCIAL'] },
      },
      include: { cobranzas: true },
      orderBy: { fecha: 'asc' },
    });

    const saldos = facturas.map((f) => {
      const cobrado = f.cobranzas.reduce((s, c) => s + Number(c.monto), 0);
      return {
        facturaId: f.id,
        numero: f.numero,
        fecha: f.fecha,
        vencimiento: f.fechaVencimiento,
        total: Number(f.total),
        cobrado,
        saldoPendiente: Number(f.total) - cobrado,
        vencida: new Date() > f.fechaVencimiento,
      };
    });

    const totalPendiente = saldos.reduce((s, f) => s + f.saldoPendiente, 0);
    return { data: { saldos, totalPendiente } };
  }
}
