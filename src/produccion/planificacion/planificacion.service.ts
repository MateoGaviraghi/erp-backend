import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class PlanificacionService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendario(currentUser: JwtPayload, desde: string, hasta: string) {
    const ordenes = await this.prisma.ordenProduccion.findMany({
      where: {
        empresaId: currentUser.empresaId,
        estado: { not: 'CANCELADA' },
        OR: [
          {
            fechaFinPlanificada: {
              gte: new Date(desde),
              lte: new Date(hasta),
            },
          },
          { estado: 'EN_PROCESO' },
        ],
      },
      include: {
        bom: {
          include: {
            producto: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { fechaFinPlanificada: 'asc' },
    });

    const resumen = {
      pendientes: ordenes.filter((o) => o.estado === 'PLANIFICADA').length,
      enProceso: ordenes.filter((o) => o.estado === 'EN_PROCESO').length,
      completadas: ordenes.filter((o) => o.estado === 'COMPLETADA').length,
    };

    return { data: ordenes, resumen };
  }

  async verificarMateriales(currentUser: JwtPayload) {
    const ordenesPlanificadas = await this.prisma.ordenProduccion.findMany({
      where: {
        empresaId: currentUser.empresaId,
        estado: 'PLANIFICADA',
      },
      include: {
        bom: {
          include: {
            materiales: {
              include: {
                material: {
                  select: {
                    id: true,
                    nombre: true,
                    code: true,
                    stockActual: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Acumular demanda por materialId
    const demandaMap = new Map<
      string,
      {
        material: {
          id: string;
          nombre: string;
          code: string;
          stockActual: unknown;
        };
        total: number;
      }
    >();

    for (const orden of ordenesPlanificadas) {
      for (const item of orden.bom.materiales) {
        const demanda =
          Number(item.cantidad) * Number(orden.cantidadPlanificada);
        const key = item.materialId;
        if (demandaMap.has(key)) {
          demandaMap.get(key)!.total += demanda;
        } else {
          demandaMap.set(key, {
            material: item.material,
            total: demanda,
          });
        }
      }
    }

    const resultado = Array.from(demandaMap.values()).map(
      ({ material, total }) => {
        const disponible = Number(material.stockActual ?? 0);
        return {
          material: {
            id: material.id,
            nombre: material.nombre,
            code: material.code,
          },
          demandaTotal: total,
          stockDisponible: disponible,
          suficiente: disponible >= total,
          diferencia: disponible - total,
        };
      },
    );

    const criticos = resultado.filter((r) => !r.suficiente);

    return { data: resultado, criticos, tieneFaltantes: criticos.length > 0 };
  }
}
