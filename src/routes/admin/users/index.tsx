import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Shield, Users } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { Input } from "@/components/ui/input";
import { getAdminUsersFn, setUserRoleFn } from "@/features/auth/api/auth.admin.api";
import { AUTH_KEYS } from "@/features/auth/queries";
import { authClient } from "@/lib/auth/auth.client";
import { ADMIN_ROLE, SUPER_ADMIN_ROLE } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  keyword: z.string().optional(),
});

type ManagedRole = "user" | "admin" | "superadmin";
type EditableRole = "user" | "admin";

type PendingAction = {
  userId: string;
  targetRole: EditableRole;
  displayName: string;
};

export const Route = createFileRoute("/admin/users/")({
  ssr: false,
  validateSearch: searchSchema,
  component: AdminUsersPage,
  loader: () => ({
    title: "用户角色管理",
  }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
    ],
  }),
});

function AdminUsersPage() {
  const { keyword } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const [searchInput, setSearchInput] = useState(keyword || "");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const usersQuery = useQuery({
    queryKey: [...AUTH_KEYS.all, "admin-users"],
    queryFn: () => getAdminUsersFn(),
  });

  const setRoleMutation = useMutation({
    mutationFn: setUserRoleFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...AUTH_KEYS.all, "admin-users"],
      });
      toast.success("角色更新成功");
      setPendingAction(null);
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? mapRoleErrorMessage(error.message)
          : "角色更新失败，请稍后重试";
      toast.error(message);
    },
  });

  const currentUserId = session?.user?.id;
  const listRef = useRef<HTMLDivElement | null>(null);

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data ?? [];
    const normalized = searchInput.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const name = (u.name || "").toLowerCase();
      return email.includes(normalized) || name.includes(normalized);
    });
  }, [searchInput, usersQuery.data]);

  const virtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 84,
    overscan: 8,
  });

  const onSearchSubmit = () => {
    navigate({
      search: () => ({
        keyword: searchInput.trim() || undefined,
      }),
    });
  };

  const openConfirm = (action: PendingAction) => {
    setPendingAction(action);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    await setRoleMutation.mutateAsync({
      data: {
        userId: pendingAction.userId,
        role: pendingAction.targetRole,
      },
    });
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-300 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-border/30 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground">
            用户角色管理
          </h1>
          <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
            SUPERADMIN ONLY
          </p>
        </div>

        <div className="w-full md:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearchSubmit();
                }
              }}
              placeholder="按用户名或邮箱筛选"
              className="pl-8 h-9 border-b border-border/50 bg-transparent rounded-none font-mono text-xs"
            />
          </div>
          <button
            onClick={onSearchSubmit}
            className="h-9 px-3 text-xs font-mono uppercase tracking-wider border border-border/40 hover:border-foreground transition-colors"
          >
            筛选
          </button>
        </div>
      </div>

      <div className="border border-border/30 bg-background">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border/20 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          <div className="col-span-4">用户</div>
          <div className="col-span-3">角色</div>
          <div className="col-span-2">创建时间</div>
          <div className="col-span-3 text-right">操作</div>
        </div>

        {usersQuery.isLoading && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            正在加载用户列表...
          </div>
        )}

        {usersQuery.isError && (
          <div className="px-4 py-10 text-center text-sm text-destructive">
            加载失败，请刷新重试
          </div>
        )}

        {!usersQuery.isLoading && !usersQuery.isError && filteredUsers.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            未找到匹配用户
          </div>
        )}

        {!usersQuery.isLoading &&
          !usersQuery.isError &&
          filteredUsers.length > 0 && (
            <>
              <div className="px-4 pt-2 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                已启用虚拟滚动，提升大数据量渲染性能
              </div>
              <div ref={listRef} className="h-[66vh] overflow-y-auto">
                <div
                  className="relative"
                  style={{ height: `${virtualizer.getTotalSize()}px` }}
                >
                  {virtualizer.getVirtualItems().map((item) => {
                    const u = filteredUsers[item.index];
                    const role = normalizeRole(u.role);
                    const isSelf = currentUserId === u.id;

                    return (
                      <div
                        key={u.id}
                        className="absolute left-0 top-0 w-full border-b border-border/10"
                        style={{ transform: `translateY(${item.start}px)` }}
                      >
                        <div className="grid grid-cols-12 gap-4 px-4 py-4 items-center">
                          <div className="col-span-4 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              {role === "superadmin" ? (
                                <Shield className="size-3.5 text-foreground shrink-0" />
                              ) : (
                                <Users className="size-3.5 text-muted-foreground shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm text-foreground truncate">
                                  {u.name || "未命名用户"}
                                </div>
                                <div className="text-xs font-mono text-muted-foreground truncate">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="col-span-3">
                            <RoleBadge role={role} />
                          </div>

                          <div className="col-span-2 text-xs text-muted-foreground font-mono">
                            {u.createdAt ? formatDate(u.createdAt) : "-"}
                          </div>

                          <div className="col-span-3 flex justify-end gap-2 flex-wrap">
                            {isSelf ? (
                              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                                当前账号
                              </span>
                            ) : (
                              <RoleActions
                                role={role}
                                loading={setRoleMutation.isPending}
                                onAction={(targetRole) =>
                                  openConfirm({
                                    userId: u.id,
                                    targetRole,
                                    displayName: u.name || u.email,
                                  })
                                }
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
      </div>

      <ConfirmationModal
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirm}
        isLoading={setRoleMutation.isPending}
        isDanger={pendingAction?.targetRole === "user"}
        title="确认变更角色"
        message={
          pendingAction
            ? `确认将 ${pendingAction.displayName} 设置为 ${roleLabel(pendingAction.targetRole)} 吗？`
            : ""
        }
        confirmLabel="确认变更"
      />
    </div>
  );
}

function RoleBadge({ role }: { role: ManagedRole }) {
  const className = cn(
    "inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border",
    role === "superadmin" && "border-foreground/30 bg-foreground text-background",
    role === "admin" && "border-border/40 text-foreground bg-muted/20",
    role === "user" && "border-border/30 text-muted-foreground",
  );

  return <span className={className}>{roleLabel(role)}</span>;
}

function RoleActions({
  role,
  loading,
  onAction,
}: {
  role: ManagedRole;
  loading: boolean;
  onAction: (targetRole: EditableRole) => void;
}) {
  if (role === "superadmin") {
    return (
      <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
        系统超管
      </span>
    );
  }

  if (role === "admin") {
    return (
      <>
        <ActionButton
          disabled={loading}
          label="降为用户"
          onClick={() => onAction("user")}
        />
      </>
    );
  }

  return <ActionButton disabled={loading} label="升为管理员" onClick={() => onAction("admin")} />;
}

function ActionButton({
  label,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-7 px-2.5 text-[10px] font-mono uppercase tracking-[0.14em] border border-border/40 hover:border-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors inline-flex items-center gap-1"
    >
      {icon}
      {label}
    </button>
  );
}

function normalizeRole(role: string | null | undefined): ManagedRole {
  if (role === SUPER_ADMIN_ROLE) return "superadmin";
  if (role === ADMIN_ROLE) return "admin";
  return "user";
}

function roleLabel(role: ManagedRole) {
  switch (role) {
    case "superadmin":
      return "SUPERADMIN";
    case "admin":
      return "ADMIN";
    default:
      return "USER";
  }
}

function mapRoleErrorMessage(code: string) {
  switch (code) {
    case "CANNOT_CHANGE_SELF_ROLE":
      return "不能修改当前登录账号的角色";
    case "CANNOT_CREATE_NEW_SUPERADMIN":
      return "超级管理员仅能由系统环境变量指定";
    case "CANNOT_MODIFY_SUPERADMIN":
      return "系统超级管理员不允许在此页面变更";
    case "INVALID_ROLE_TRANSITION":
      return "仅支持普通用户与管理员之间升降级";
    case "USER_NOT_FOUND":
      return "用户不存在或已删除";
    default:
      return "角色更新失败，请稍后重试";
  }
}

function formatDate(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
