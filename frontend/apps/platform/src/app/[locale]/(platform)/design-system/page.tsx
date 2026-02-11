"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Palette, Zap } from "lucide-react";

export default function DesignSystemPage() {
  const locale = useLocale();

  const texts = {
    title: locale === "ar" ? "نظام التصميم" : "Design System",
    description: locale === "ar" ? "مرجع مكونات واستخدام نظام التصميم" : "Design system components and usage reference",
    colors: locale === "ar" ? "الألوان" : "Colors",
    typography: locale === "ar" ? "الطباعة" : "Typography",
    buttons: locale === "ar" ? "الأزرار" : "Buttons",
    badges: locale === "ar" ? "الشارات" : "Badges",
    forms: locale === "ar" ? "النماذج" : "Forms",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Palette className="h-6 w-6" />
          {texts.title}
        </h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{texts.colors}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-primary" />
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground font-mono">var(--primary)</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-secondary" />
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground font-mono">var(--secondary)</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-destructive" />
              <p className="text-sm font-medium">Destructive</p>
              <p className="text-xs text-muted-foreground font-mono">var(--destructive)</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-muted" />
              <p className="text-sm font-medium">Muted</p>
              <p className="text-xs text-muted-foreground font-mono">var(--muted)</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-accent" />
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground font-mono">var(--accent)</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg border bg-card" />
              <p className="text-sm font-medium">Card</p>
              <p className="text-xs text-muted-foreground font-mono">var(--card)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{texts.typography}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">text-4xl font-bold</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Heading 2</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">text-3xl font-bold</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold">Heading 3</h3>
            <p className="text-xs text-muted-foreground font-mono mt-1">text-2xl font-bold</p>
          </div>
          <div>
            <p className="text-base">Body text - Regular paragraph text</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">text-base</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Small text - Captions and helper text</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">text-sm text-muted-foreground</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{texts.buttons}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Zap className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{texts.badges}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{texts.forms}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="demo-input">Label</Label>
            <Input id="demo-input" placeholder="Placeholder text" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-disabled">Disabled Input</Label>
            <Input id="demo-disabled" placeholder="Disabled" disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
