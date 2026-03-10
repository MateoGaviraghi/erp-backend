import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateOrdenProduccionDto,
  FinalizarOrdenDto,
  CancelarOrdenDto,
} from './dto/create-orden.dto.js';
import { EstadoOrdenProduccion, TipoMovimientoStock } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class OrdenesProduccionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload) {
    const data = await this.prisma.ordenProduccion.findMany({
      where: { empresaId: currentUser.empresaId },
      include: {
        bom: {
          include: {
            producto: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const orden = await this.prisma.ordenProduccion.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        bom: {
          include: {
            producto: { select: { id: true, name: true, code: true } },
            materiales: {
              include: {
                material: {
                  select: {
                    id: true,
                    nombre: true,
                    code: true,
                    costoUnitario: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!orden)
      throw new NotFoundException('Orden de producción no encontrada');

    const materialesRequeridos = orden.bom.materiales.map((item) => ({
      material: item.material,
      cantidadPorUnidad: Number(item.cantidad),
      cantidadTotal: Number(item.cantidad) * Number(orden.cantidadPlanificada),
      unidad: item.unidad,
    }));

    return { data: { ...orden, materialesRequeridos } };
  }

  async create(
    dto: CreateOrdenProduccionDto,
    localId: string,
    currentUser: JwtPayload,
  ) {
    const bom = await this.prisma.bOM.findFirst({
      where: { id: dto.bomId, empresaId: currentUser.empresaId },
      include: {
        producto: { select: { id: true, name: true, code: true, unit: true } },
      },
    });
    if (!bom) throw new NotFoundException('BOM no encontrado');

    const count = await this.prisma.ordenProduccion.count({
      where: { empresaId: currentUser.empresaId },
    });
    const code = `OP-${String(count + 1).padStart(4, '0')}`;

    const orden = await this.prisma.ordenProduccion.create({
      data: {
        empresaId: currentUser.empresaId,
        localId,
        code,
        bomId: dto.bomId,
        productoId: bom.productoId,
        productoNombre: bom.producto.name,
        cantidadPlanificada: dto.cantidadPlanificada,
        unidad: bom.unidad,
        fechaInicio: new Date(),
        fechaFinPlanificada: new Date(dto.fechaFinPlanificada),
        operador: dto.operador ?? currentUser.nombre,
        notas: dto.notas,
        costoManoObra: dto.costoManoObra ?? 0,
      },
      include: {
        bom: {
          include: {
            producto: { select: { name: true, code: true } },
          },
        },
      },
    });

    return { data: orden };
  }

  async iniciar(id: string, currentUser: JwtPayload) {
    const orden = await this.prisma.ordenProduccion.findFirst({
      where: {
        id,
        empresaId: currentUser.empresaId,
        estado: EstadoOrdenProduccion.PLANIFICADA,
      },
      include: {
        bom: { include: { materiales: true } },
      },
    });
    if (!orden) {
      throw new NotFoundException(
        'Orden no encontrada o no está en estado PLANIFICADA',
      );
    }

    // Verificar stock suficiente para cada material
    for (const item of orden.bom.materiales) {
      const cantRequerida =
        Number(item.cantidad) * Number(orden.cantidadPlanificada);
      const material = await this.prisma.materialProduccion.findUnique({
        where: { id: item.materialId },
        select: { nombre: true, stockActual: true },
      });
      if (material && Number(material.stockActual) < cantRequerida) {
        throw new BadRequestException(
          `Stock insuficiente para "${material.nombre}". ` +
            `Requerido: ${cantRequerida}, Disponible: ${Number(material.stockActual)}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      let costoMateriales = 0;

      for (const item of orden.bom.materiales) {
        const cantRequerida =
          Number(item.cantidad) * Number(orden.cantidadPlanificada);
        costoMateriales += cantRequerida * Number(item.costoUnitario);

        await tx.materialProduccion.update({
          where: { id: item.materialId },
          data: { stockActual: { decrement: cantRequerida } },
        });
      }

      const ordenActualizada = await tx.ordenProduccion.update({
        where: { id },
        data: {
          estado: EstadoOrdenProduccion.EN_PROCESO,
          costoMateriales,
          costoTotal: costoMateriales + Number(orden.costoManoObra),
        },
      });

      return { data: ordenActualizada };
    });
  }

  async finalizar(id: string, dto: FinalizarOrdenDto, currentUser: JwtPayload) {
    const orden = await this.prisma.ordenProduccion.findFirst({
      where: {
        id,
        empresaId: currentUser.empresaId,
        estado: EstadoOrdenProduccion.EN_PROCESO,
      },
    });
    if (!orden)
      throw new NotFoundException('Orden no encontrada o no está EN_PROCESO');

    return this.prisma.$transaction(async (tx) => {
      // Ingresar producto terminado al stock del local
      const stockExistente = await tx.stock.findFirst({
        where: {
          localId: orden.localId,
          productoId: orden.productoId,
          depositoId: null,
        },
      });

      if (stockExistente) {
        await tx.stock.update({
          where: { id: stockExistente.id },
          data: { cantidad: { increment: dto.cantidadRealizada } },
        });
      } else {
        await tx.stock.create({
          data: {
            empresaId: currentUser.empresaId,
            localId: orden.localId,
            productoId: orden.productoId,
            cantidad: dto.cantidadRealizada,
          },
        });
      }

      await tx.movimientoStock.create({
        data: {
          empresaId: currentUser.empresaId,
          localId: orden.localId,
          productoId: orden.productoId,
          tipo: TipoMovimientoStock.PRODUCCION_ENTRADA,
          cantidad: dto.cantidadRealizada,
          observaciones: `Finalización orden de producción ${orden.code}`,
          creadoPor: currentUser.nombre,
        },
      });

      const ordenActualizada = await tx.ordenProduccion.update({
        where: { id },
        data: {
          estado: EstadoOrdenProduccion.COMPLETADA,
          cantidadProducida: dto.cantidadRealizada,
          fechaFinReal: new Date(),
        },
      });

      return { data: ordenActualizada };
    });
  }

  async cancelar(id: string, dto: CancelarOrdenDto, currentUser: JwtPayload) {
    const orden = await this.prisma.ordenProduccion.findFirst({
      where: {
        id,
        empresaId: currentUser.empresaId,
        estado: {
          in: [
            EstadoOrdenProduccion.PLANIFICADA,
            EstadoOrdenProduccion.EN_PROCESO,
          ],
        },
      },
      include: {
        bom: { include: { materiales: true } },
      },
    });
    if (!orden)
      throw new NotFoundException('Orden no encontrada o no se puede cancelar');

    return this.prisma.$transaction(async (tx) => {
      // Si ya había iniciado, reintegrar materiales
      if (orden.estado === EstadoOrdenProduccion.EN_PROCESO) {
        for (const item of orden.bom.materiales) {
          const cantReintegrar =
            Number(item.cantidad) * Number(orden.cantidadPlanificada);
          await tx.materialProduccion.update({
            where: { id: item.materialId },
            data: { stockActual: { increment: cantReintegrar } },
          });
        }
      }

      const ordenActualizada = await tx.ordenProduccion.update({
        where: { id },
        data: {
          estado: EstadoOrdenProduccion.CANCELADA,
          notas: dto.motivo,
        },
      });

      return { data: ordenActualizada };
    });
  }
}
