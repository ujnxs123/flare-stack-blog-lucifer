import { and, desc, eq, isNotNull, count } from "drizzle-orm";
import { account, user } from "@/lib/db/schema";

export async function userHasPassword(db: DB, userId: string) {
  const userAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), isNotNull(account.password)),
  });

  return !!userAccount;
}

export async function updateUser(
  db: DB,
  userId: string,
  data: Partial<Omit<typeof user.$inferInsert, "id" | "createdAt">>,
) {
  const [updatedUser] = await db
    .update(user)
    .set(data)
    .where(eq(user.id, userId))
    .returning();
  return updatedUser;
}

export async function findUserById(db: DB, userId: string) {
  return await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
}

export async function listUsers(db: DB) {
  return await db.query.user.findMany({
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
    orderBy: desc(user.createdAt),
  });
}

export async function listUsersPaginated(
  db: DB,
  { limit = 20, offset = 0 }: { limit?: number; offset?: number },
) {
  const [users, [{ total }]] = await Promise.all([
    db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
      orderBy: desc(user.createdAt),
      limit: Math.max(1, Math.min(100, limit)), // 限制 1-100
      offset: Math.max(0, offset),
    }),
    db
      .select({ total: count() })
      .from(user)
      .$dynamic(),
  ]);

  return {
    users,
    total,
    limit,
    offset,
  };
}

export async function countUsersByRole(db: DB, role: string) {
  const rows = await db.query.user.findMany({
    columns: { id: true },
    where: eq(user.role, role),
  });
  return rows.length;
}
