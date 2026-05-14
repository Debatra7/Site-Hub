import Dexie, { type Table } from 'dexie';

export type EntityType =
  | 'USER_PREFERENCE'
  | 'CATEGORY'
  | 'WEBSITE'
  | 'STICKY_NOTE'
  | 'TAG'
  | 'SHARED_BOARD'
  | 'MEDIA_ASSET';

export type SyncStatus = 'SYNCED' | 'DIRTY' | 'DELETED' | 'CONFLICTED';
export type SyncOperationType = 'INSERT' | 'UPDATE' | 'DELETE';
export type SyncQueueStatus = 'QUEUED' | 'IN_FLIGHT' | 'APPLIED' | 'CONFLICTED' | 'FAILED';
export type ConflictStrategy = 'LAST_WRITE' | 'MERGE' | 'MANUAL';
export type ConflictStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export interface SyncMetadata {
  syncStatus: SyncStatus;
  version: number;
  lastSyncedVersion?: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface Category extends SyncMetadata {
  id: string;
  userId?: string;
  name: string;
  icon?: string;
  wallpaperMediaId?: string;
  visibility: 'PRIVATE' | 'UNLISTED' | 'SHARED' | 'PUBLIC';
  orderIndex: number;
}

export interface Website extends SyncMetadata {
  id: string;
  userId?: string;
  categoryId: string;
  url: string;
  normalizedUrl: string;
  title?: string;
  description?: string;
  faviconUrl?: string;
  thumbnailMediaId?: string;
  customIconMediaId?: string;
  customColor?: string;
  note?: string;
  isPinned: boolean;
  orderIndex: number;
  metadata?: unknown;
}

export interface StickyNote extends SyncMetadata {
  id: string;
  userId?: string;
  categoryId?: string;
  type: 'TEXT' | 'CHECKLIST' | 'MEDIA' | 'LINK';
  title?: string;
  content: unknown;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  color?: string;
  reminderAt?: number;
  completedAt?: number;
  visibility: 'PRIVATE' | 'UNLISTED' | 'SHARED' | 'PUBLIC';
}

export interface Tag extends SyncMetadata {
  id: string;
  userId?: string;
  name: string;
  normalizedName: string;
  color?: string;
}

export interface EntityTag {
  id: string;
  entityType: Extract<EntityType, 'CATEGORY' | 'WEBSITE' | 'STICKY_NOTE'>;
  entityId: string;
  tagId: string;
  syncStatus: SyncStatus;
  updatedAt: number;
}

export interface UserPreference extends SyncMetadata {
  id: string;
  userId?: string;
  theme: 'light' | 'dark' | 'system';
  accentColor?: string;
  layout?: unknown;
  dashboardConfig?: unknown;
  privacyDefaults?: unknown;
}

export interface SyncQueueItem {
  id: string;
  idempotencyKey: string;
  entityType: EntityType;
  entityId: string;
  operation: SyncOperationType;
  baseVersion?: number;
  clientVersion: number;
  payload?: unknown;
  status: SyncQueueStatus;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

export interface EntityVersion {
  id: string;
  entityType: EntityType;
  entityId: string;
  version: number;
  operation: SyncOperationType;
  snapshot: unknown;
  changedFields: string[];
  createdAt: number;
}

export interface ConflictRecord {
  id: string;
  queueItemId?: string;
  entityType: EntityType;
  entityId: string;
  clientVersion?: number;
  serverVersion?: number;
  clientSnapshot?: unknown;
  serverSnapshot?: unknown;
  strategy?: ConflictStrategy;
  status: ConflictStatus;
  createdAt: number;
  resolvedAt?: number;
}

export interface SyncCursor {
  id: string;
  userId?: string;
  deviceId?: string;
  cursor?: string;
  lastPulledAt?: number;
  lastPushedAt?: number;
  lastSuccessfulSyncAt?: number;
  lastError?: string;
  isOnline: boolean;
  isSyncing: boolean;
}

export interface DeviceProfile {
  id: string;
  userId?: string;
  clientId: string;
  deviceName?: string;
  activeAccountId?: string;
  createdAt: number;
  lastSeenAt: number;
}

export class AppDatabase extends Dexie {
  categories!: Table<Category, string>;
  websites!: Table<Website, string>;
  stickyNotes!: Table<StickyNote, string>;
  tags!: Table<Tag, string>;
  entityTags!: Table<EntityTag, string>;
  preferences!: Table<UserPreference, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  entityVersions!: Table<EntityVersion, string>;
  conflicts!: Table<ConflictRecord, string>;
  syncCursors!: Table<SyncCursor, string>;
  deviceProfiles!: Table<DeviceProfile, string>;

  constructor() {
    super('BetaHubDB');

    this.version(1).stores({
      categories: 'id, name, orderIndex, _sync_status',
      websites: 'id, categoryId, url, orderIndex, _sync_status',
      stickyNotes: 'id, categoryId, type, _sync_status',
    });

    this.version(2)
      .stores({
        categories: 'id, userId, [userId+orderIndex], [userId+visibility], syncStatus, updatedAt, deletedAt',
        websites:
          'id, userId, categoryId, [categoryId+orderIndex], [categoryId+normalizedUrl], [userId+updatedAt], syncStatus, deletedAt',
        stickyNotes:
          'id, userId, categoryId, [categoryId+positionX+positionY], [userId+updatedAt], [userId+reminderAt], syncStatus, deletedAt',
        tags: 'id, userId, [userId+normalizedName], [userId+name], syncStatus, updatedAt',
        entityTags: 'id, [entityType+entityId], tagId, syncStatus, updatedAt',
        preferences: 'id, userId, syncStatus, updatedAt',
        syncQueue:
          'id, idempotencyKey, status, nextAttemptAt, [status+nextAttemptAt], [entityType+entityId], createdAt',
        entityVersions: 'id, [entityType+entityId+version], [entityType+entityId], createdAt',
        conflicts: 'id, status, [entityType+entityId], createdAt',
        syncCursors: 'id, userId, deviceId, lastSuccessfulSyncAt',
        deviceProfiles: 'id, userId, clientId, activeAccountId, lastSeenAt',
      })
      .upgrade(async (transaction) => {
        const now = Date.now();

        await transaction
          .table<Category>('categories')
          .toCollection()
          .modify((category) => {
            const legacyStatus = (category as Category & { _sync_status?: string })._sync_status;

            category.visibility =
              category.visibility ??
              ((category as Category & { isPrivate?: boolean }).isPrivate === false ? 'SHARED' : 'PRIVATE');
            category.syncStatus = legacyStatus === 'SYNCED' ? 'SYNCED' : 'DIRTY';
            category.version = category.version ?? 1;
            category.updatedAt = category.updatedAt ?? now;
          });

        await transaction
          .table<Website>('websites')
          .toCollection()
          .modify((website) => {
            const legacyStatus = (website as Website & { _sync_status?: string })._sync_status;

            website.normalizedUrl = website.normalizedUrl ?? website.url.trim().toLowerCase();
            website.syncStatus = legacyStatus === 'SYNCED' ? 'SYNCED' : 'DIRTY';
            website.version = website.version ?? 1;
            website.updatedAt = website.updatedAt ?? now;
          });

        await transaction
          .table<StickyNote>('stickyNotes')
          .toCollection()
          .modify((note) => {
            const legacyStatus = (note as StickyNote & { _sync_status?: string })._sync_status;

            note.visibility = note.visibility ?? 'PRIVATE';
            note.syncStatus = legacyStatus === 'SYNCED' ? 'SYNCED' : 'DIRTY';
            note.version = note.version ?? 1;
            note.updatedAt = note.updatedAt ?? now;
          });
      });

    // v2 categories omitted standalone `orderIndex`; Dexie requires an index for orderBy('orderIndex').
    this.version(3).stores({
      categories:
        'id, userId, orderIndex, [userId+orderIndex], [userId+visibility], syncStatus, updatedAt, deletedAt',
      websites:
        'id, userId, categoryId, [categoryId+orderIndex], [categoryId+normalizedUrl], [userId+updatedAt], syncStatus, deletedAt',
      stickyNotes:
        'id, userId, categoryId, [categoryId+positionX+positionY], [userId+updatedAt], [userId+reminderAt], syncStatus, deletedAt',
      tags: 'id, userId, [userId+normalizedName], [userId+name], syncStatus, updatedAt',
      entityTags: 'id, [entityType+entityId], tagId, syncStatus, updatedAt',
      preferences: 'id, userId, syncStatus, updatedAt',
      syncQueue:
        'id, idempotencyKey, status, nextAttemptAt, [status+nextAttemptAt], [entityType+entityId], createdAt',
      entityVersions: 'id, [entityType+entityId+version], [entityType+entityId], createdAt',
      conflicts: 'id, status, [entityType+entityId], createdAt',
      syncCursors: 'id, userId, deviceId, lastSuccessfulSyncAt',
      deviceProfiles: 'id, userId, clientId, activeAccountId, lastSeenAt',
    });
  }
}

export const db = new AppDatabase();
