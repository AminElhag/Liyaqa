"use client";

import { Fragment } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import { cn } from "@liyaqa/shared/lib/utils";
import { COMPARISON_CATEGORIES, SECTION_TEXTS, PLANS, type CellValue } from "./pricing-data";

function CellContent({ value }: { value: CellValue }) {
  if (value === true) {
    return <Check className="h-4 w-4 text-green-500 mx-auto" />;
  }
  if (value === false) {
    return <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  }
  return <span className="text-sm font-medium text-muted-foreground">{value}</span>;
}

export function ComparisonTable() {
  const locale = useLocale();
  const t = (obj: { en: string; ar: string }) => (locale === "ar" ? obj.ar : obj.en);
  const texts = SECTION_TEXTS.comparison;

  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm">
            {t(texts.badge)}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">{t(texts.title)}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t(texts.subtitle)}
          </p>
        </motion.div>

        {/* Table with horizontal scroll */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-5xl mx-auto rounded-2xl border bg-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40%] bg-slate-900 text-white font-semibold dark:bg-slate-800">
                    {t(texts.feature)}
                  </TableHead>
                  {PLANS.map((plan) => (
                    <TableHead
                      key={plan.name.en}
                      className={cn(
                        "w-[20%] text-center font-semibold text-white",
                        plan.isPopular
                          ? "bg-primary dark:bg-primary"
                          : "bg-slate-900 dark:bg-slate-800"
                      )}
                    >
                      {t(plan.name)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPARISON_CATEGORIES.map((category) => (
                  <Fragment key={category.name.en}>
                    {/* Category separator */}
                    <TableRow className="hover:bg-muted/50">
                      <TableCell
                        colSpan={4}
                        className="bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground py-2.5"
                      >
                        {t(category.name)}
                      </TableCell>
                    </TableRow>

                    {/* Feature rows */}
                    {category.rows.map((row) => (
                      <TableRow key={row.feature.en}>
                        <TableCell className="font-medium text-sm sticky start-0 bg-card z-10">
                          {t(row.feature)}
                        </TableCell>
                        <TableCell className="text-center">
                          <CellContent value={row.starter} />
                        </TableCell>
                        <TableCell className="text-center bg-primary/[0.03]">
                          <CellContent value={row.professional} />
                        </TableCell>
                        <TableCell className="text-center">
                          <CellContent value={row.enterprise} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
