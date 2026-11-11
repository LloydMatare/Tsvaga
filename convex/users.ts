import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getViewer, requireViewer } from "./lib/auth";

export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getViewer(ctx);
  },
});

export const sync = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    const name =
      identity.name ?? identity.email?.split("@")[0] ?? "Tsvaga traveler";

    if (existing) {
      const patch: {
        name?: string;
        email?: string;
        avatarUrl?: string;
      } = {};
      if (identity.name && identity.name !== existing.name) {
        patch.name = identity.name;
      }
      if (identity.email && identity.email !== existing.email) {
        patch.email = identity.email;
      }
      if (identity.pictureUrl && identity.pictureUrl !== existing.avatarUrl) {
        patch.avatarUrl = identity.pictureUrl;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch("users", existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name,
      email: identity.email ?? undefined,
      avatarUrl: identity.pictureUrl ?? undefined,
      role: "traveler",
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const patch: { name?: string; phone?: string } = {};
    if (args.name && args.name.trim().length > 1) patch.name = args.name.trim();
    if (args.phone !== undefined) patch.phone = args.phone.trim();
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("users", viewer._id, patch);
    }
    return viewer._id;
  },
});

export const bootstrapAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in first.");

    const existingAdmins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .take(1);
    if (existingAdmins.length > 0) {
      throw new Error("An admin already exists for this deployment.");
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      const id = await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        name: identity.name ?? identity.email?.split("@")[0] ?? "Admin",
        email: identity.email ?? undefined,
        avatarUrl: identity.pictureUrl ?? undefined,
        role: "traveler",
      });
      user = await ctx.db.get("users", id);
    }

    if (!user) throw new Error("Could not create the admin profile.");
    await ctx.db.patch("users", user._id, { role: "admin" });
    return user._id;
  },
});
