/**
 * Standard paged result for list queries.
 */
export interface IPagedResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Cursor-based pagination token for large datasets.
 */
export interface ICursorToken {
  nextLink?: string;
  lastId?: number;
  lastModified?: string;
}

/**
 * Cursor-based page request parameters.
 */
export interface ICursorPageRequest {
  pageSize: number;
  token?: ICursorToken | null;
  projectCode?: string;
  filters?: Record<string, unknown>;
}

/**
 * Cursor-based page result for infinite scroll / keyset pagination.
 */
export interface ICursorPageResult<T> {
  items: T[];
  nextToken: ICursorToken | null;
  hasMore: boolean;
  totalApprox?: number;
}

/**
 * Standard query options for SharePoint list queries.
 */
export interface IListQueryOptions {
  filter?: string;
  orderBy?: string;
  orderAscending?: boolean;
  top?: number;
  skip?: number;
  select?: string[];
}
