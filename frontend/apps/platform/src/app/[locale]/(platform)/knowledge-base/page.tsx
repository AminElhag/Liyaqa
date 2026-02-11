"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, BookOpen, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  useKBCategories,
  useKBArticles,
  useSearchKBArticles,
  useDeleteKBArticle,
} from "@liyaqa/shared/queries/platform/use-knowledge-base";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useDebouncedValue } from "@liyaqa/shared/hooks/use-debounced-value";
import type { ArticleCategory } from "@liyaqa/shared/types/platform/knowledge-base";

export default function KnowledgeBasePage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | undefined>();
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const { data: categories, isLoading: isLoadingCategories } = useKBCategories();
  const { data: articles, isLoading: isLoadingArticles } = useKBArticles({
    category: selectedCategory,
    page: 0,
    size: 20,
  });
  const { data: searchResults, isLoading: isSearching } = useSearchKBArticles(
    debouncedSearch, 0, 20, { enabled: debouncedSearch.length > 0 }
  );

  const deleteMutation = useDeleteKBArticle();
  const canEdit = user?.role === "PLATFORM_ADMIN" || user?.role === "SUPPORT_REP";

  const texts = {
    title: locale === "ar" ? "قاعدة المعرفة" : "Knowledge Base",
    description: locale === "ar" ? "إدارة مقالات المساعدة والوثائق" : "Manage help articles and documentation",
    newArticle: locale === "ar" ? "مقال جديد" : "New Article",
    search: locale === "ar" ? "بحث..." : "Search...",
    allCategories: locale === "ar" ? "جميع الفئات" : "All Categories",
    views: locale === "ar" ? "مشاهدات" : "Views",
    delete: locale === "ar" ? "حذف" : "Delete",
    edit: locale === "ar" ? "تعديل" : "Edit",
  };

  const categoryLabels: Record<ArticleCategory, { en: string; ar: string }> = {
    GETTING_STARTED: { en: "Getting Started", ar: "البداية" },
    BILLING: { en: "Billing", ar: "الفوترة" },
    FEATURES: { en: "Features", ar: "الميزات" },
    TROUBLESHOOTING: { en: "Troubleshooting", ar: "حل المشاكل" },
    API: { en: "API", ar: "واجهة برمجية" },
    FAQ: { en: "FAQ", ar: "أسئلة شائعة" },
    BEST_PRACTICES: { en: "Best Practices", ar: "أفضل الممارسات" },
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === "ar" ? "هل تريد حذف هذا المقال؟" : "Delete this article?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: locale === "ar" ? "تم" : "Success", description: locale === "ar" ? "تم حذف المقال" : "Article deleted" });
    } catch (error) {
      toast({ title: locale === "ar" ? "خطأ" : "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const displayedArticles = debouncedSearch.length > 0 ? searchResults?.content : articles?.content;

  if (isLoadingCategories || isLoadingArticles) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/${locale}/knowledge-base/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.newArticle}
            </Link>
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={texts.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={selectedCategory === undefined ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(undefined)}>
          {texts.allCategories}
        </Button>
        {categories?.map((cat) => (
          <Button
            key={cat.category}
            variant={selectedCategory === cat.category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.category)}
          >
            {locale === "ar" ? categoryLabels[cat.category].ar : categoryLabels[cat.category].en} ({cat.count})
          </Button>
        ))}
      </div>

      {isSearching || isLoadingArticles ? (
        <div className="flex items-center justify-center py-12">
          <Loading text={locale === "ar" ? "جاري البحث..." : "Searching..."} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedArticles?.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">
                    {locale === "ar" && article.titleAr ? article.titleAr : article.title}
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {locale === "ar" ? categoryLabels[article.category].ar : categoryLabels[article.category].en}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{article.viewCount} {texts.views}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/knowledge-base/${article.id}`)} className="flex-1">
                    {locale === "ar" ? "عرض" : "View"}
                  </Button>
                  {canEdit && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/knowledge-base/${article.id}/edit`)}>
                        {texts.edit}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)} disabled={deleteMutation.isPending}>
                        {texts.delete}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {displayedArticles?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {locale === "ar" ? "لا توجد مقالات" : "No articles found"}
        </div>
      )}
    </div>
  );
}
