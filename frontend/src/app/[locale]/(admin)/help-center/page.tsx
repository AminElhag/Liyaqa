"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  MessageSquare,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Book,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Ticket status type
 */
type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_ON_CLIENT" | "RESOLVED" | "CLOSED";

/**
 * Ticket priority type
 */
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

/**
 * Support ticket
 */
interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

/**
 * Help article
 */
interface HelpArticle {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  categoryAr: string;
  views: number;
}

// Mock data for demonstration
const mockTickets: SupportTicket[] = [
  {
    id: "1",
    ticketNumber: "TKT-2026-0042",
    subject: "Door not opening at 5 AM",
    status: "RESOLVED",
    priority: "HIGH",
    category: "Technical",
    createdAt: "2026-01-25T05:00:00Z",
    updatedAt: "2026-01-25T09:00:00Z",
    lastMessage: "Issue resolved - Kisi API timeout was the cause.",
  },
  {
    id: "2",
    ticketNumber: "TKT-2026-0038",
    subject: "How to set up family memberships?",
    status: "WAITING_ON_CLIENT",
    priority: "MEDIUM",
    category: "General",
    createdAt: "2026-01-24T10:00:00Z",
    updatedAt: "2026-01-24T14:00:00Z",
    lastMessage: "We've sent you a guide. Let us know if you need more help.",
  },
];

const popularArticles: HelpArticle[] = [
  {
    id: "1",
    title: "How to connect Kisi access control",
    titleAr: "كيفية ربط التحكم في الوصول Kisi",
    category: "Access Control",
    categoryAr: "التحكم في الوصول",
    views: 1234,
  },
  {
    id: "2",
    title: "Understanding failed payments",
    titleAr: "فهم المدفوعات الفاشلة",
    category: "Billing",
    categoryAr: "الفواتير",
    views: 987,
  },
  {
    id: "3",
    title: "Importing members from spreadsheet",
    titleAr: "استيراد الأعضاء من جدول بيانات",
    category: "Members",
    categoryAr: "الأعضاء",
    views: 876,
  },
  {
    id: "4",
    title: "Setting up class schedules",
    titleAr: "إعداد جداول الصفوف",
    category: "Classes",
    categoryAr: "الصفوف",
    views: 654,
  },
];

/**
 * Status configuration
 */
const statusConfig: Record<TicketStatus, { label: string; labelAr: string; color: string; icon: React.ReactNode }> = {
  OPEN: {
    label: "Open",
    labelAr: "مفتوح",
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    icon: <MessageSquare className="h-3 w-3" />,
  },
  IN_PROGRESS: {
    label: "In Progress",
    labelAr: "قيد التنفيذ",
    color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
    icon: <Clock className="h-3 w-3" />,
  },
  WAITING_ON_CLIENT: {
    label: "Waiting on You",
    labelAr: "في انتظارك",
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  RESOLVED: {
    label: "Resolved",
    labelAr: "تم الحل",
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  CLOSED: {
    label: "Closed",
    labelAr: "مغلق",
    color: "text-gray-600 bg-gray-100 dark:bg-gray-900/30",
    icon: <CheckCircle className="h-3 w-3" />,
  },
};

/**
 * Priority configuration
 */
const priorityConfig: Record<TicketPriority, { label: string; labelAr: string; color: string }> = {
  LOW: { label: "Low", labelAr: "منخفض", color: "text-gray-600" },
  MEDIUM: { label: "Medium", labelAr: "متوسط", color: "text-blue-600" },
  HIGH: { label: "High", labelAr: "عالي", color: "text-orange-600" },
  URGENT: { label: "Urgent", labelAr: "عاجل", color: "text-red-600" },
};

export default function SupportPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("tickets");

  const texts = {
    title: isRtl ? "مركز الدعم" : "Support Center",
    subtitle: isRtl ? "احصل على المساعدة وإدارة التذاكر" : "Get help and manage your support tickets",
    search: isRtl ? "ابحث في مقالات المساعدة..." : "Search help articles...",
    newTicket: isRtl ? "تذكرة جديدة" : "New Ticket",
    myTickets: isRtl ? "تذاكري" : "My Tickets",
    helpCenter: isRtl ? "مركز المساعدة" : "Help Center",
    contact: isRtl ? "اتصل بنا" : "Contact",
    noTickets: isRtl ? "لا توجد تذاكر" : "No tickets yet",
    createFirst: isRtl ? "أنشئ أول تذكرة للحصول على المساعدة" : "Create your first ticket to get help",
    popularArticles: isRtl ? "المقالات الشائعة" : "Popular Articles",
    viewAll: isRtl ? "عرض الكل" : "View All",
    lastUpdate: isRtl ? "آخر تحديث" : "Last update",
    contactOptions: {
      title: isRtl ? "طرق الاتصال الأخرى" : "Other Ways to Reach Us",
      email: {
        title: isRtl ? "البريد الإلكتروني" : "Email",
        description: isRtl ? "نرد خلال 24 ساعة" : "We respond within 24 hours",
        value: "support@liyaqa.com",
      },
      phone: {
        title: isRtl ? "الهاتف" : "Phone",
        description: isRtl ? "متاح من 9 ص - 6 م" : "Available 9 AM - 6 PM",
        value: "+966 11 234 5678",
      },
      chat: {
        title: isRtl ? "الدردشة المباشرة" : "Live Chat",
        description: isRtl ? "متاح أثناء ساعات العمل" : "Available during business hours",
        value: isRtl ? "ابدأ الدردشة" : "Start Chat",
      },
    },
  };

  const filteredTickets = mockTickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 me-2" />
          {texts.newTicket}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={texts.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tickets" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {texts.myTickets}
          </TabsTrigger>
          <TabsTrigger value="help" className="gap-2">
            <Book className="h-4 w-4" />
            {texts.helpCenter}
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <Phone className="h-4 w-4" />
            {texts.contact}
          </TabsTrigger>
        </TabsList>

        {/* My Tickets Tab */}
        <TabsContent value="tickets" className="mt-6">
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">{texts.noTickets}</h3>
                <p className="text-muted-foreground mb-4">{texts.createFirst}</p>
                <Button>
                  <Plus className="h-4 w-4 me-2" />
                  {texts.newTicket}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => {
                const status = statusConfig[ticket.status];
                const priority = priorityConfig[ticket.priority];

                return (
                  <Card key={ticket.id} className="hover:shadow-sm transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-muted-foreground">{ticket.ticketNumber}</span>
                            <Badge className={cn("text-xs", status.color)}>
                              {status.icon}
                              <span className="ms-1">{isRtl ? status.labelAr : status.label}</span>
                            </Badge>
                            <span className={cn("text-xs font-medium", priority.color)}>
                              {isRtl ? priority.labelAr : priority.label}
                            </span>
                          </div>
                          <h3 className="font-medium mb-1">{ticket.subject}</h3>
                          {ticket.lastMessage && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {ticket.lastMessage}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {texts.lastUpdate}:{" "}
                            {formatDistanceToNow(new Date(ticket.updatedAt), {
                              addSuffix: true,
                              locale: isRtl ? ar : enUS,
                            })}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Help Center Tab */}
        <TabsContent value="help" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{texts.popularArticles}</CardTitle>
                <Button variant="ghost" size="sm">
                  {texts.viewAll}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {popularArticles.map((article) => (
                  <button
                    key={article.id}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <HelpCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{isRtl ? article.titleAr : article.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {isRtl ? article.categoryAr : article.category}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{texts.contactOptions.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Email */}
                <div className="p-4 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">{texts.contactOptions.email.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {texts.contactOptions.email.description}
                  </p>
                  <a
                    href={`mailto:${texts.contactOptions.email.value}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {texts.contactOptions.email.value}
                  </a>
                </div>

                {/* Phone */}
                <div className="p-4 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">{texts.contactOptions.phone.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {texts.contactOptions.phone.description}
                  </p>
                  <a
                    href={`tel:${texts.contactOptions.phone.value}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {texts.contactOptions.phone.value}
                  </a>
                </div>

                {/* Live Chat */}
                <div className="p-4 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                    <MessageCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">{texts.contactOptions.chat.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {texts.contactOptions.chat.description}
                  </p>
                  <Button variant="outline" size="sm">
                    {texts.contactOptions.chat.value}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
