import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // usuarioId
  email: string;
  nombre: string;
  rol: UserRole;
  empresaId: string;
  localId: string | null;
}

export interface JwtRefreshPayload {
  sub: string; // usuarioId
  tokenId: string; // ID del RefreshToken en DB (para validar que no fue revocado)
}
