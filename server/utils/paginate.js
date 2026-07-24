// Normalise page/limit query params and return skip/limit plus a metadata
// builder so every list endpoint paginates the same way.
export function getPagination(query, { defaultLimit = 12, maxLimit = 60 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return {
    page,
    limit,
    skip,
    meta(total) {
      return {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore: skip + limit < total,
      };
    },
  };
}
