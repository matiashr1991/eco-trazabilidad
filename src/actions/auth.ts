"use server";

import { redirect } from "next/navigation";
import { AuditAction } from "@prisma/client";
import { clearSession, establishSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    redirect("/login?error=Credenciales+incompletas");
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.activo || !verifyPassword(password, user.passwordHash)) {
    redirect("/login?error=Usuario+o+clave+incorrectos");
  }

  await establishSession(user.id);

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "User",
      entityId: user.id,
      action: AuditAction.LOGIN,
      afterJson: { username: user.username },
    },
  });

  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

