export const SUPER_ADMIN_ROLE = "superadmin";
export const ADMIN_ROLE = "admin";

export function isSuperAdminRole(role?: string | null) {
  return role === SUPER_ADMIN_ROLE;
}

export function isContentAdminRole(role?: string | null) {
  return role === ADMIN_ROLE || role === SUPER_ADMIN_ROLE;
}
