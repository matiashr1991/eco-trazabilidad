import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySessionToken, createSessionToken } from "@/lib/session";
import { AuthenticatedUser, hasPermission } from "./permissions";

export * from "./permissions";

const SESSION_COOKIE = "trz_session";

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
    include: { 
      internalNode: true,
      role: true
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    nombre: user.nombre,
    username: user.username,
    roleId: user.roleId,
    roleName: user.role?.nombre ?? null,
    permissions: (user.role?.permissions as string[]) ?? [],
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
  if (!hasPermission(user, "MANAGE_PARAMETRICS")) {
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
