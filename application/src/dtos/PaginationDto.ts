export type PaginationMeta = {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
};

export type PaginatedDto<T> = {
  items: T[];
  pagination: PaginationMeta;
};
