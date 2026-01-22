"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI to render when an error occurs */
  fallback?: ReactNode;
  /** Callback when user clicks retry */
  onReset?: () => void;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Locale for bilingual messages */
  locale?: string;
  /** Show home button to navigate away */
  showHomeButton?: boolean;
  /** Custom home URL */
  homeUrl?: string;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Bilingual text for error messages
 */
const texts = {
  en: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again or contact support if the problem persists.",
    retry: "Try Again",
    home: "Go Home",
    details: "Error Details",
    showDetails: "Show technical details",
  },
  ar: {
    title: "حدث خطأ ما",
    description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو الاتصال بالدعم إذا استمرت المشكلة.",
    retry: "حاول مجدداً",
    home: "الصفحة الرئيسية",
    details: "تفاصيل الخطأ",
    showDetails: "عرض التفاصيل التقنية",
  },
};

/**
 * Error Boundary component that catches JavaScript errors in its child component tree.
 * Displays a fallback UI with retry and navigation options.
 *
 * @example
 * ```tsx
 * <ErrorBoundary locale={locale} onReset={() => refetch()}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    const homeUrl = this.props.homeUrl || "/";
    window.location.href = homeUrl;
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, locale = "en", showHomeButton = true } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const t = texts[locale === "ar" ? "ar" : "en"];
      const isRtl = locale === "ar";

      return (
        <div
          className="flex items-center justify-center min-h-[400px] p-4"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <Card className="max-w-md w-full border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">{t.title}</h2>
            </CardHeader>

            <CardContent className="text-center">
              <p className="text-muted-foreground text-sm">{t.description}</p>

              {/* Show error message in development */}
              {process.env.NODE_ENV === "development" && error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    {t.showDetails}
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-40">
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </details>
              )}
            </CardContent>

            <CardFooter className="flex justify-center gap-3">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                {t.retry}
              </Button>

              {showHomeButton && (
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
                  {t.home}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * A simpler error fallback component for use within queries/mutations.
 * Can be used standalone without wrapping in ErrorBoundary.
 */
interface ErrorFallbackProps {
  error: Error | null;
  onRetry?: () => void;
  locale?: string;
  className?: string;
}

export function ErrorFallback({
  error,
  onRetry,
  locale = "en",
  className,
}: ErrorFallbackProps) {
  if (!error) return null;

  const t = texts[locale === "ar" ? "ar" : "en"];
  const isRtl = locale === "ar";

  return (
    <Card
      className={`border-destructive/30 bg-destructive/5 dark:bg-destructive/10 ${className}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t.title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{t.description}</p>

        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 ${isRtl ? "ml-2" : "mr-2"}`} />
            {t.retry}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook-like wrapper for error boundary that provides reset functionality.
 * Useful when you need programmatic error handling.
 */
interface WithErrorBoundaryOptions {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  locale?: string;
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `WithErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return WithErrorBoundaryComponent;
}
