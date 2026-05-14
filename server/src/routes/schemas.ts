import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination';

export const idParams = z.object({ id: z.string().uuid() });
export const tokenParams = z.object({ token: z.string().min(16).max(256) });

export const entityType = z.enum([
  'USER_PREFERENCE',
  'CATEGORY',
  'WEBSITE',
  'STICKY_NOTE',
  'TAG',
  'SHARED_BOARD',
  'MEDIA_ASSET',
]);

export const visibility = z.enum(['PRIVATE', 'UNLISTED', 'SHARED', 'PUBLIC']);
export const sortOrder = z.enum(['asc', 'desc']).default('desc');

export const listQuery = paginationQuerySchema.extend({
  updatedSince: z.coerce.date().optional(),
  sort: sortOrder.optional(),
});

export const authSchemas = {
  refresh: z.object({ refreshToken: z.string().min(24).optional() }),
  logout: z.object({ sessionId: z.string().uuid().optional() }),
};

export const categorySchemas = {
  listQuery: listQuery.extend({ visibility: visibility.optional() }),
  create: z.object({
    name: z.string().trim().min(1).max(120),
    icon: z.string().max(256).optional(),
    wallpaperMediaId: z.string().uuid().optional(),
    visibility: visibility.default('PRIVATE'),
    orderIndex: z.number().int().min(0).default(0),
  }),
  update: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    icon: z.string().max(256).nullable().optional(),
    wallpaperMediaId: z.string().uuid().nullable().optional(),
    visibility: visibility.optional(),
    orderIndex: z.number().int().min(0).optional(),
  }),
  reorder: z.object({
    items: z.array(z.object({ id: z.string().uuid(), orderIndex: z.number().int().min(0) })).min(1).max(500),
  }),
};

export const websiteSchemas = {
  listQuery: listQuery.extend({
    categoryId: z.string().uuid().optional(),
    tagId: z.string().uuid().optional(),
    q: z.string().trim().max(200).optional(),
  }),
  create: z.object({
    categoryId: z.string().uuid(),
    url: z.string().url().max(2048),
    title: z.string().trim().max(200).optional(),
    description: z.string().max(1000).optional(),
    faviconUrl: z.string().url().max(2048).optional(),
    customColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    note: z.string().max(5000).optional(),
    isPinned: z.boolean().default(false),
    orderIndex: z.number().int().min(0).default(0),
    tagIds: z.array(z.string().uuid()).max(50).optional(),
  }),
  update: z.object({
    categoryId: z.string().uuid().optional(),
    title: z.string().trim().max(200).nullable().optional(),
    description: z.string().max(1000).nullable().optional(),
    customColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
    note: z.string().max(5000).nullable().optional(),
    isPinned: z.boolean().optional(),
    orderIndex: z.number().int().min(0).optional(),
    tagIds: z.array(z.string().uuid()).max(50).optional(),
  }),
  bulk: z.object({
    action: z.enum(['MOVE', 'DELETE', 'PIN', 'UNPIN']),
    ids: z.array(z.string().uuid()).min(1).max(200),
    categoryId: z.string().uuid().optional(),
  }),
};

export const stickyNoteSchemas = {
  listQuery: listQuery.extend({
    categoryId: z.string().uuid().optional(),
    tagId: z.string().uuid().optional(),
  }),
  create: z.object({
    categoryId: z.string().uuid().optional(),
    type: z.enum(['TEXT', 'CHECKLIST', 'MEDIA', 'LINK']).default('TEXT'),
    title: z.string().trim().max(200).optional(),
    content: z.unknown(),
    positionX: z.number().int().default(0),
    positionY: z.number().int().default(0),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    color: z.string().max(64).optional(),
    reminderAt: z.coerce.date().optional(),
    visibility: visibility.default('PRIVATE'),
    tagIds: z.array(z.string().uuid()).max(50).optional(),
  }),
  update: z.object({
    categoryId: z.string().uuid().nullable().optional(),
    title: z.string().trim().max(200).nullable().optional(),
    content: z.unknown().optional(),
    positionX: z.number().int().optional(),
    positionY: z.number().int().optional(),
    width: z.number().int().positive().nullable().optional(),
    height: z.number().int().positive().nullable().optional(),
    color: z.string().max(64).nullable().optional(),
    reminderAt: z.coerce.date().nullable().optional(),
    completedAt: z.coerce.date().nullable().optional(),
    visibility: visibility.optional(),
    tagIds: z.array(z.string().uuid()).max(50).optional(),
  }),
};

export const tagSchemas = {
  listQuery: listQuery.extend({ q: z.string().trim().max(120).optional() }),
  create: z.object({
    name: z.string().trim().min(1).max(80),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }),
  update: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  }),
  merge: z.object({ targetTagId: z.string().uuid() }),
  assignment: z.object({
    entityType: z.enum(['CATEGORY', 'WEBSITE', 'STICKY_NOTE']),
    entityId: z.string().uuid(),
    tagId: z.string().uuid(),
  }),
};

export const syncSchemas = {
  push: z.object({
    deviceId: z.string().uuid().optional(),
    operations: z.array(z.object({
      idempotencyKey: z.string().min(8).max(128),
      entityType,
      entityId: z.string().uuid(),
      operation: z.enum(['INSERT', 'UPDATE', 'DELETE']),
      baseVersion: z.number().int().min(0).optional(),
      clientVersion: z.number().int().min(1),
      payload: z.unknown().optional(),
    })).min(1).max(500),
  }),
  pullQuery: paginationQuerySchema.extend({
    since: z.string().optional(),
    deviceId: z.string().uuid().optional(),
  }),
  resolveConflict: z.object({
    strategy: z.enum(['LAST_WRITE', 'MERGE', 'MANUAL']),
    resolvedPayload: z.unknown().optional(),
  }),
  registerDevice: z.object({
    clientId: z.string().min(8).max(128),
    deviceName: z.string().max(120).optional(),
    deviceType: z.string().max(80).optional(),
    platform: z.string().max(80).optional(),
    browser: z.string().max(80).optional(),
  }),
};

export const sharingSchemas = {
  create: z.object({
    categoryId: z.string().uuid(),
    permission: z.enum(['VIEW', 'EDIT']).default('VIEW'),
    expiresAt: z.coerce.date().optional(),
    allowDiscovery: z.boolean().default(false),
  }),
  update: z.object({
    permission: z.enum(['VIEW', 'EDIT']).optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    status: z.enum(['ACTIVE', 'REVOKED', 'EXPIRED']).optional(),
  }),
  member: z.object({
    userId: z.string().uuid(),
    permission: z.enum(['VIEW', 'EDIT']).default('VIEW'),
  }),
};

export const analyticsSchemas = {
  ingest: z.object({
    source: z.enum(['WEB_APP', 'PWA', 'EXTENSION', 'SERVER', 'ADMIN']),
    eventName: z.string().min(1).max(120),
    anonymousId: z.string().max(128).optional(),
    properties: z.record(z.unknown()).optional(),
    occurredAt: z.coerce.date().optional(),
  }),
  adminQuery: paginationQuerySchema.extend({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    eventName: z.string().max(120).optional(),
    source: z.enum(['WEB_APP', 'PWA', 'EXTENSION', 'SERVER', 'ADMIN']).optional(),
  }),
};

export const importExportSchemas = {
  importBody: z.object({
    source: z.string().max(120).optional(),
    conflictStrategy: z.enum(['MERGE', 'REPLACE', 'SKIP', 'MANUAL']).default('MANUAL'),
    payload: z.unknown(),
  }),
  exportQuery: z.object({
    scope: z.enum(['ACCOUNT', 'CATEGORY', 'NOTES', 'SETTINGS']).default('ACCOUNT'),
    categoryId: z.string().uuid().optional(),
  }),
};

export const settingsSchemas = {
  update: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
    layout: z.unknown().optional(),
    dashboardConfig: z.unknown().optional(),
    privacyDefaults: z.unknown().optional(),
  }),
};
