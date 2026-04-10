import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // usuarioId
  email: string;
  nombre: string;
  rol: UserRole;
  empresaId: string;
  localId: string | null;
}
