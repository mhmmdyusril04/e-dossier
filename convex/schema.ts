import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const fileTypes = v.union(v.literal('image'), v.literal('file'), v.literal('folder'));

export const roles = v.union(v.literal('admin'), v.literal('member'));

export const documentTypeEnum = ['Kepangkatan', 'Jabatan', 'KGB', 'SKP/PPKP', 'LP2P', 'Hukdis', 'Cuti', 'Lainnya'] as const;

export const documentTypes = v.union(
    v.literal('Kepangkatan'),
    v.literal('Jabatan'),
    v.literal('KGB'),
    v.literal('SKP/PPKP'),
    v.literal('LP2P'),  
    v.literal('Hukdis'),
    v.literal('Cuti'),
    v.literal('Lainnya')
);

export default defineSchema({
    files: defineTable({
        name: v.string(),
        type: fileTypes,
        orgId: v.string(),
        fileId: v.optional(v.id('_storage')),
        documentType: v.optional(documentTypes),
        userId: v.id('users'),
        shouldDelete: v.optional(v.boolean()),
        parentId: v.optional(v.id('files')),
    })
        .index('by_orgId', ['orgId'])
        .index('by_shouldDelete', ['shouldDelete'])
        .index('by_parentId', ['parentId']),
    favorites: defineTable({
        fileId: v.id('files'),
        orgId: v.string(),
        userId: v.id('users'),
    }).index('by_userId_orgId_fileId', ['userId', 'orgId', 'fileId']),
    users: defineTable({
        tokenIdentifier: v.string(),
        name: v.optional(v.string()),
        image: v.optional(v.string()),
        role: roles,
        bidangId: v.optional(v.id('bidang')),
    }).index('by_tokenIdentifier', ['tokenIdentifier']),
});
