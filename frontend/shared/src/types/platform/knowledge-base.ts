export type ArticleCategory = "GETTING_STARTED" | "BILLING" | "FEATURES" | "TROUBLESHOOTING" | "API" | "FAQ" | "BEST_PRACTICES";
export type ArticleStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

/** Maps to backend ArticleResponse */
export interface KBArticle {
  id: string;
  slug: string;
  title: string;
  titleAr?: string;
  content: string;
  contentAr?: string;
  category: ArticleCategory;
  tags: string[];
  status: ArticleStatus;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  authorId: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Maps to backend ArticleSummaryResponse */
export interface KBArticleSummary {
  id: string;
  slug: string;
  title: string;
  titleAr?: string;
  category: ArticleCategory;
  status: ArticleStatus;
  viewCount: number;
  publishedAt?: string;
  updatedAt: string;
}

/** Maps to backend CategoryCountResponse */
export interface KBCategoryCount {
  category: ArticleCategory;
  count: number;
}

/** Maps to backend CreateArticleRequest */
export interface KBArticleCreateRequest {
  title: string;
  titleAr?: string;
  content: string;
  contentAr?: string;
  category: ArticleCategory;
  tags?: string[];
  status?: ArticleStatus;
}

/** Maps to backend UpdateArticleRequest */
export interface KBArticleUpdateRequest {
  title?: string;
  titleAr?: string;
  content?: string;
  contentAr?: string;
  category?: ArticleCategory;
  tags?: string[];
  status?: ArticleStatus;
}

/** Query params for list endpoint */
export interface KBArticleQueryParams {
  category?: ArticleCategory;
  status?: ArticleStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}
