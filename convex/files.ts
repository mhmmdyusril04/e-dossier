import { ConvexError, v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import {
  MutationCtx,
  QueryCtx,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { documentTypes, fileTypes } from "./schema";
import { getUser } from "./users";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("you must be logged in to upload a file");
  }

  return await ctx.storage.generateUploadUrl();
});

export const createFolder = mutation({
  args: {
    name: v.string(),
    orgId: v.string(),
    parentId: v.optional(v.id("files")),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("you must be logged in to create a folder");
    }

    const user = await getUser(ctx, identity.tokenIdentifier);

    if (user.role !== "admin") {
      throw new ConvexError("you do not have access to this file");
    }

    await ctx.db.insert("files", {
      name: args.name,
      type: "folder",
      orgId: args.orgId,
      userId: user._id,
      parentId: args.parentId,
    });
  },
});

export const createFile = mutation({
  args: {
    name: v.string(),
    fileId: v.id("_storage"),
    orgId: v.string(),
    type: fileTypes,
    documentType: documentTypes,
    parentId: v.optional(v.id("files")),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("you must be logged in to create a folder");
    }

    const user = await getUser(ctx, identity.tokenIdentifier);

    if (user.role !== "admin") {
      throw new ConvexError("you do not have access to this file");
    }

    await ctx.db.insert("files", {
      name: args.name,
      orgId: args.orgId,
      fileId: args.fileId,
      type: args.type,
      userId: user._id,
      documentType: args.documentType,
      parentId: args.parentId,
    });
  },
});

export const getFiles = query({
  args: {
    orgId: v.string(),
    query: v.optional(v.string()),
    favorites: v.optional(v.boolean()),
    deletedOnly: v.optional(v.boolean()),
    type: v.optional(fileTypes),
    documentType: v.optional(documentTypes),
    parentId: v.optional(v.id("files")),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("you must be logged in");
    }

    const user = await getUser(ctx, identity.tokenIdentifier);
    if (user.role !== "admin") return [];

    let files: Doc<"files">[] = [];

    // Get favorite file IDs if needed
    let favoriteIds: Id<"files">[] = [];
    if (args.favorites) {
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_userId_orgId_fileId", (q) =>
          q.eq("userId", user._id).eq("orgId", args.orgId)
        )
        .collect();

      favoriteIds = favorites.map((f) => f.fileId);
    }

    // Main file query (base)
    if (args.parentId !== undefined) {
      files = await ctx.db
        .query("files")
        .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId))
        .collect();
    } else {
      files = await ctx.db
        .query("files")
        .withIndex("by_parentId", (q) => q.eq("parentId", undefined))
        .collect();
    }

    // Deleted filter
    if (args.deletedOnly) {
      files = files.filter((file) => file.shouldDelete === true);
    } else {
      files = files.filter((file) => !file.shouldDelete);
    }

    // Favorites filter
    if (args.favorites) {
      files = files.filter((file) => favoriteIds.includes(file._id));
    }

    // Parent folder filter
    if (args.parentId !== undefined) {
      files = files.filter((file) => file.parentId === args.parentId);
    }

    // Type and documentType filters
    if (args.type) {
      files = files.filter((file) => file.type === args.type);
    }

    if (args.documentType) {
      files = files.filter((file) => file.documentType === args.documentType);
    }

    // Search query
    if (args.query) {
      files = files.filter((file) =>
        file.name.toLowerCase().includes(args.query!.toLowerCase())
      );
    }

    const filesWithUrl = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: file.fileId ? await ctx.storage.getUrl(file.fileId) : null,
      }))
    );

    return filesWithUrl;
  },
});

export const deleteAllFiles = internalMutation({
  args: {},
  async handler(ctx) {
    const files = await ctx.db
      .query("files")
      .withIndex("by_shouldDelete", (q) => q.eq("shouldDelete", true))
      .collect();

    await Promise.all(
      files.map(async (file) => {
        if (file.fileId) {
          await ctx.storage.delete(file.fileId);
        }
        return await ctx.db.delete(file._id);
      })
    );
  },
});

function assertCanDeleteFile(user: Doc<"users">, file: Doc<"files">) {
  const canDelete = file.userId === user._id || user.role === "admin";

  if (!canDelete) {
    throw new ConvexError("you have no acces to delete this file");
  }
}

export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);

    if (!access) {
      throw new ConvexError("no access to file");
    }

    assertCanDeleteFile(access.user, access.file);

    await ctx.db.patch(args.fileId, {
      shouldDelete: true,
    });
  },
});

export const restoreFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);

    if (!access) {
      throw new ConvexError("no access to file");
    }

    assertCanDeleteFile(access.user, access.file);

    await ctx.db.patch(args.fileId, {
      shouldDelete: false,
    });
  },
});

export const toggleFavorite = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);

    if (!access) {
      throw new ConvexError("no access to file");
    }

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q
          .eq("userId", access.user._id)
          .eq("orgId", access.file.orgId)
          .eq("fileId", access.file._id)
      )
      .first();

    if (!favorite) {
      await ctx.db.insert("favorites", {
        fileId: access.file._id,
        userId: access.user._id,
        orgId: access.file.orgId,
      });
    } else {
      await ctx.db.delete(favorite._id);
    }
  },
});

export const getAllFavorites = query({
  args: { orgId: v.string() },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("you must be logged in to create a folder");
    }

    const user = await getUser(ctx, identity.tokenIdentifier);

    if (user.role !== "admin") {
      return [];
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q.eq("userId", user._id).eq("orgId", args.orgId)
      )
      .collect();

    return favorites;
  },
});

async function hasAccessToFile(
  ctx: QueryCtx | MutationCtx,
  fileId: Id<"files">
) {
  const file = await ctx.db.get(fileId);

  if (!file) {
    return null;
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("you must be logged in to create a folder");
  }

  const user = await getUser(ctx, identity.tokenIdentifier);

  if (user.role !== "admin") {
    return null;
  }

  return { user: user, file };
}

export const getFolderPath = query({
  args: {
    fileId: v.optional(v.id("files")),
  },
  async handler(ctx, args) {
    const { fileId } = args;
    if (!fileId) {
      return [];
    }

    const getPath = async (
      currentId: Id<"files">,
      path: { _id: Id<"files">; name: string }[]
    ): Promise<{ _id: Id<"files">; name: string }[]> => {
      const file = await ctx.db.get(currentId);
      if (!file) {
        return path;
      }

      const newPath = [{ _id: file._id, name: file.name }, ...path];

      if (file.parentId) {
        return getPath(file.parentId, newPath);
      } else {
        return newPath;
      }
    };

    return await getPath(fileId, []);
  },
});
