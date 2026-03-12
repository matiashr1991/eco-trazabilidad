import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSessionToken, verifySessionToken } from "@/lib/session";

const SESSION_COOKIE = "trz_session";

export type AuthenticatedUser = {
  id: string;
  nombre: string;
  username: string;
  role: UserRole;
  internalNodeId: string | null;
  internalNodeName: string | null;
};

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId, activo: true },
    include: { internalNode: true },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    nombre: user.nombre,
    username: user.username,
    role: user.role,
    internalNodeId: user.internalNodeId,
    internalNodeName: user.internalNode?.nombre ?? null,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== UserRole.ADMIN) {
    redirect("/");
  }
  return user;
}

export async function establishSession(userId: string) {
  const token = createSessionToken(userId);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function canOperateArea(user: AuthenticatedUser, internalNodeId: string) {
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  if (!user.internalNodeId) {
    return false;
  }

  return user.internalNodeId === internalNodeId;
}

export function canCreateExpediente(user: AuthenticatedUser) {
  return user.role === UserRole.ADMIN || user.role === UserRole.AREA_MANAGER;
}

export function canMoveExpediente(user: AuthenticatedUser) {
  return user.role === UserRole.ADMIN || user.role === UserRole.AREA_MANAGER;
}

