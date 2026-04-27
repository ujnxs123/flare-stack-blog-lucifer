import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as AuthService from "@/features/auth/service/auth.service";
import { adminMiddleware } from "@/lib/middlewares";

const SetUserRoleInputSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin"]),
});

export const getAdminUsersFn = createServerFn()
  .middleware([adminMiddleware])
  .handler(({ context }) => AuthService.listUsersForAdmin(context));

export const setUserRoleFn = createServerFn({
  method: "POST",
})
  .middleware([adminMiddleware])
  .inputValidator(SetUserRoleInputSchema)
  .handler(({ context, data }) => AuthService.setUserRoleForAdmin(context, data));
