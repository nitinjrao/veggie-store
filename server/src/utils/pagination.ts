export function parsePagination(query: { page?: string; limit?: string }, defaultLimit = 20) {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
