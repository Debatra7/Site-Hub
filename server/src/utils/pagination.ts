import { z } from 'zod';

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginated = <T>(items: T[], nextCursor?: string) => ({
  data: items,
  page: {
    nextCursor,
    hasMore: Boolean(nextCursor),
  },
});
