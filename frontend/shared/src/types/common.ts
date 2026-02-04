import type { PaginatedResponse } from "./api";

export type Page<T> = PaginatedResponse<T>;

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
}
