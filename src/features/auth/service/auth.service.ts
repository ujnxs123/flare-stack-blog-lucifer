import * as AuthRepo from "@/features/auth/data/auth.data";
import * as ConfigService from "@/features/config/service/config.service";
import { ADMIN_ROLE, SUPER_ADMIN_ROLE } from "@/lib/auth/roles";

export async function getSession(context: SessionContext) {
  return context.session;
}

export async function userHasPassword(context: AuthContext) {
  return await AuthRepo.userHasPassword(context.db, context.session.user.id);
}

export async function getIsEmailConfigured(
  context: DbContext & { executionCtx: ExecutionContext },
) {
  const config = await ConfigService.getSystemConfig(context);
  return !!(
    config?.email?.host &&
    config.email.username &&
    config.email.password &&
    config.email.senderAddress
  );
}

export async function listUsersForAdmin(context: AuthContext) {
  return await AuthRepo.listUsers(context.db);
}

export async function setUserRoleForAdmin(
  context: AuthContext,
  input: { userId: string; role: "user" | "admin" | "superadmin" },
) {
  // 禁止修改自己的角色
  if (input.userId === context.session.user.id) {
    throw new Error("CANNOT_CHANGE_SELF_ROLE");
  }

  const targetUser = await AuthRepo.findUserById(context.db, input.userId);
  if (!targetUser) {
    throw new Error("USER_NOT_FOUND");
  }

  // 禁止创建新的 superadmin（superadmin 由 ADMIN_EMAIL 初始化，唯一）
  if (input.role === "superadmin") {
    throw new Error("CANNOT_CREATE_NEW_SUPERADMIN");
  }

  // 禁止修改现有 superadmin
  if (targetUser.role === SUPER_ADMIN_ROLE) {
    throw new Error("CANNOT_MODIFY_SUPERADMIN");
  }

  // 仅允许 user ↔ admin 互转
  if (input.role !== "user" && input.role !== "admin") {
    throw new Error("INVALID_ROLE_TRANSITION");
  }

  const nextRole = input.role === "admin" ? ADMIN_ROLE : "user";

  const updatedUser = await AuthRepo.updateUser(context.db, input.userId, {
    role: nextRole,
  });

  if (!updatedUser) {
    throw new Error("USER_NOT_FOUND");
  }

  return updatedUser;
}
