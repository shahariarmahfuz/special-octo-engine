import { z } from "zod";

export const paginationSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional()
});

export function parsePagination(query: unknown): { page: number; limit: number } {
  const result = paginationSchema.safeParse(query);
  const page = result.success && result.data.page ? Number(result.data.page) : 1;
  const limit = result.success && result.data.limit ? Number(result.data.limit) : 10;
  return {
    page: Number.isNaN(page) || page <= 0 ? 1 : page,
    limit: Number.isNaN(limit) || limit <= 0 ? 10 : Math.min(limit, 50)
  };
}
