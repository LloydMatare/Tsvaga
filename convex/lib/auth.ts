import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

type DbCtx = QueryCtx | MutationCtx;

export type Viewer = Doc<"users"> | null;

export async function getViewer(ctx: DbCtx): Promise<Viewer> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  return user ?? null;
}

export async function requireViewer(ctx: DbCtx): Promise<Doc<"users">> {
  const viewer = await getViewer(ctx);
  if (!viewer) {
    throw new Error("You need to be signed in to do that.");
  }
  return viewer;
}

export async function requireAdmin(ctx: DbCtx): Promise<Doc<"users">> {
  const viewer = await requireViewer(ctx);
  if (viewer.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return viewer;
}

export async function requireOperator(
  ctx: DbCtx,
): Promise<{ viewer: Doc<"users">; operator: Doc<"operators"> }> {
  const viewer = await requireViewer(ctx);
  const operator = await ctx.db
    .query("operators")
    .withIndex("by_owner", (q) => q.eq("ownerUserId", viewer._id))
    .first();

  if (!operator) {
    throw new Error("Create an operator profile first.");
  }

  if (operator.status === "suspended") {
    throw new Error("This operator account is suspended.");
  }

  return { viewer, operator };
}

export async function ownsProperty(
  ctx: DbCtx,
  propertyId: Id<"properties">,
  operatorId: Id<"operators">,
) {
  const property = await ctx.db.get("properties", propertyId);
  if (!property) throw new Error("Property not found.");
  if (property.operatorId !== operatorId) {
    throw new Error("You do not have access to this property.");
  }
  return property;
}
