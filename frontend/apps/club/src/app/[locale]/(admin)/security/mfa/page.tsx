"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { mfaApi } from "@liyaqa/shared/lib/api/mfa";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Key,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@liyaqa/shared/components/ui/alert";

export default function MfaPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for MFA setup flow
  const [setupStep, setSetupStep] = React.useState<"initial" | "qr" | "verify" | "backup">("initial");
  const [mfaSecret, setMfaSecret] = React.useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("");
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [disablePassword, setDisablePassword] = React.useState("");
  const [showDisableDialog, setShowDisableDialog] = React.useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = React.useState(false);

  // Fetch MFA status
  const { data: mfaStatus, isLoading } = useQuery({
    queryKey: ["mfaStatus"],
    queryFn: () => mfaApi.getStatus(),
  });

  // Setup MFA mutation
  const setupMutation = useMutation({
    mutationFn: () => mfaApi.setupMfa(),
    onSuccess: (data) => {
      setMfaSecret(data.secret);
      setQrCodeUrl(data.qrCodeUrl);
      setBackupCodes(data.backupCodes);
      setSetupStep("qr");
      toast({
        title: locale === "ar" ? "جاهز للإعداد" : "Ready to Setup",
        description: locale === "ar"
          ? "قم بمسح رمز QR باستخدام تطبيق المصادقة الخاص بك"
          : "Scan the QR code with your authenticator app",
      });
    },
    onError: (error: Error & { message?: string }) => {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: error.message || (locale === "ar" ? "فشل بدء إعداد MFA" : "Failed to initiate MFA setup"),
        variant: "destructive",
      });
    },
  });

  // Verify setup mutation
  const verifySetupMutation = useMutation({
    mutationFn: (code: string) =>
      mfaApi.verifySetup({
        secret: mfaSecret,
        code,
        backupCodes,
      }),
    onSuccess: () => {
      setSetupStep("backup");
      queryClient.invalidateQueries({ queryKey: ["mfaStatus"] });
      toast({
        title: locale === "ar" ? "تم تفعيل MFA" : "MFA Enabled",
        description: locale === "ar"
          ? "تم تفعيل المصادقة الثنائية بنجاح"
          : "Two-factor authentication enabled successfully",
      });
    },
    onError: (error: Error & { message?: string }) => {
      toast({
        title: locale === "ar" ? "رمز غير صالح" : "Invalid Code",
        description: error.message || (locale === "ar" ? "الرمز المدخل غير صحيح" : "The code you entered is incorrect"),
        variant: "destructive",
      });
    },
  });

  // Disable MFA mutation
  const disableMutation = useMutation({
    mutationFn: (password: string) => mfaApi.disableMfa(password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfaStatus"] });
      setShowDisableDialog(false);
      setDisablePassword("");
      toast({
        title: locale === "ar" ? "تم تعطيل MFA" : "MFA Disabled",
        description: locale === "ar"
          ? "تم تعطيل المصادقة الثنائية"
          : "Two-factor authentication has been disabled",
      });
    },
    onError: (error: Error & { message?: string }) => {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: error.message || (locale === "ar" ? "كلمة مرور غير صحيحة" : "Incorrect password"),
        variant: "destructive",
      });
    },
  });

  // Regenerate backup codes mutation
  const regenerateMutation = useMutation({
    mutationFn: () => mfaApi.regenerateBackupCodes(),
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodesDialog(true);
      queryClient.invalidateQueries({ queryKey: ["mfaStatus"] });
      toast({
        title: locale === "ar" ? "تم إنشاء رموز جديدة" : "New Codes Generated",
        description: locale === "ar"
          ? "تم إنشاء رموز احتياطية جديدة. احفظها بأمان"
          : "New backup codes generated. Save them securely",
      });
    },
    onError: (error: Error & { message?: string }) => {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: error.message || (locale === "ar" ? "فشل إنشاء رموز احتياطية" : "Failed to generate backup codes"),
        variant: "destructive",
      });
    },
  });

  const handleVerifyCode = () => {
    if (verificationCode.length === 6) {
      verifySetupMutation.mutate(verificationCode);
    }
  };

  const handleDisableMfa = () => {
    if (disablePassword) {
      disableMutation.mutate(disablePassword);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast({
      title: locale === "ar" ? "تم النسخ" : "Copied",
      description: locale === "ar" ? "تم نسخ الرموز إلى الحافظة" : "Codes copied to clipboard",
    });
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liyaqa-mfa-backup-codes-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const finishSetup = () => {
    setSetupStep("initial");
    setMfaSecret("");
    setQrCodeUrl("");
    setBackupCodes([]);
    setVerificationCode("");
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8" />
          {locale === "ar" ? "المصادقة الثنائية (MFA)" : "Two-Factor Authentication (MFA)"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {locale === "ar"
            ? "أضف طبقة أمان إضافية إلى حسابك باستخدام المصادقة الثنائية"
            : "Add an extra layer of security to your account with two-factor authentication"}
        </p>
      </div>

      {/* MFA Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {mfaStatus?.enabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <ShieldOff className="h-5 w-5 text-gray-400" />
                )}
                {locale === "ar" ? "الحالة" : "Status"}
              </CardTitle>
              <CardDescription className="mt-2">
                {mfaStatus?.enabled
                  ? locale === "ar"
                    ? "المصادقة الثنائية مفعلة"
                    : "Two-factor authentication is enabled"
                  : locale === "ar"
                  ? "المصادقة الثنائية غير مفعلة"
                  : "Two-factor authentication is not enabled"}
              </CardDescription>
            </div>
            <Badge variant={mfaStatus?.enabled ? "default" : "secondary"} className="text-lg px-4 py-2">
              {mfaStatus?.enabled ? (
                locale === "ar" ? "مفعل" : "Enabled"
              ) : (
                locale === "ar" ? "معطل" : "Disabled"
              )}
            </Badge>
          </div>
        </CardHeader>
        {mfaStatus?.enabled && (
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">
                    {locale === "ar" ? "الرموز الاحتياطية" : "Backup Codes"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {mfaStatus.unusedBackupCodesCount}{" "}
                    {locale === "ar" ? "رموز متبقية" : "codes remaining"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 me-2" />
                {locale === "ar" ? "إنشاء رموز جديدة" : "Regenerate"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Setup Flow or Disable Button */}
      {!mfaStatus?.enabled && setupStep === "initial" && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "تفعيل MFA" : "Enable MFA"}</CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "احم حسابك بالمصادقة الثنائية باستخدام تطبيق المصادقة"
                : "Protect your account with two-factor authentication using an authenticator app"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertTitle>{locale === "ar" ? "ستحتاج إلى" : "You'll need"}</AlertTitle>
              <AlertDescription>
                {locale === "ar"
                  ? "تطبيق مصادقة مثل Google Authenticator أو Authy أو Microsoft Authenticator على هاتفك"
                  : "An authenticator app like Google Authenticator, Authy, or Microsoft Authenticator on your phone"}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium">{locale === "ar" ? "كيف يعمل" : "How it works"}</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>
                  {locale === "ar"
                    ? "قم بمسح رمز QR باستخدام تطبيق المصادقة"
                    : "Scan the QR code with your authenticator app"}
                </li>
                <li>
                  {locale === "ar"
                    ? "أدخل الرمز المكون من 6 أرقام من التطبيق"
                    : "Enter the 6-digit code from the app"}
                </li>
                <li>
                  {locale === "ar"
                    ? "احفظ الرموز الاحتياطية بأمان"
                    : "Save your backup codes securely"}
                </li>
              </ol>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>
              <Shield className="h-4 w-4 me-2" />
              {locale === "ar" ? "بدء الإعداد" : "Start Setup"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* QR Code Step */}
      {setupStep === "qr" && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "مسح رمز QR" : "Scan QR Code"}</CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "استخدم تطبيق المصادقة لمسح هذا الرمز"
                : "Use your authenticator app to scan this code"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <QRCodeSVG value={qrCodeUrl} size={200} />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{locale === "ar" ? "لا يمكنك المسح؟" : "Can't scan?"}</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  {locale === "ar"
                    ? "أدخل هذا الرمز يدويًا في تطبيقك:"
                    : "Enter this code manually in your app:"}
                </p>
                <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm break-all">
                  {mfaSecret}
                </code>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="verification-code">
                {locale === "ar" ? "رمز التحقق (6 أرقام)" : "Verification Code (6 digits)"}
              </Label>
              <Input
                id="verification-code"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSetupStep("initial");
                setVerificationCode("");
              }}
            >
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleVerifyCode}
              disabled={verificationCode.length !== 6 || verifySetupMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 me-2" />
              {locale === "ar" ? "التحقق والتفعيل" : "Verify & Enable"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Backup Codes Step */}
      {setupStep === "backup" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {locale === "ar" ? "الرموز الاحتياطية" : "Backup Codes"}
            </CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "احفظ هذه الرموز بأمان. يمكن استخدام كل رمز مرة واحدة فقط"
                : "Save these codes securely. Each code can only be used once"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{locale === "ar" ? "مهم" : "Important"}</AlertTitle>
              <AlertDescription>
                {locale === "ar"
                  ? "هذه هي المرة الوحيدة التي سترى فيها هذه الرموز. احفظها في مكان آمن"
                  : "This is the only time you'll see these codes. Save them in a safe place"}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-white dark:bg-gray-900 rounded">
                  {code}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={copyBackupCodes}>
              <Copy className="h-4 w-4 me-2" />
              {locale === "ar" ? "نسخ" : "Copy"}
            </Button>
            <Button variant="outline" onClick={downloadBackupCodes}>
              <Download className="h-4 w-4 me-2" />
              {locale === "ar" ? "تحميل" : "Download"}
            </Button>
            <Button onClick={finishSetup} className="ms-auto">
              {locale === "ar" ? "إنهاء" : "Finish"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Disable MFA Button */}
      {mfaStatus?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">{locale === "ar" ? "تعطيل MFA" : "Disable MFA"}</CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "إزالة المصادقة الثنائية من حسابك"
                : "Remove two-factor authentication from your account"}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="destructive" onClick={() => setShowDisableDialog(true)}>
              <ShieldOff className="h-4 w-4 me-2" />
              {locale === "ar" ? "تعطيل MFA" : "Disable MFA"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Disable MFA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === "ar" ? "تأكيد تعطيل MFA" : "Confirm Disable MFA"}
            </DialogTitle>
            <DialogDescription>
              {locale === "ar"
                ? "أدخل كلمة المرور الخاصة بك لتعطيل المصادقة الثنائية"
                : "Enter your password to disable two-factor authentication"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {locale === "ar" ? "كلمة المرور" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder={locale === "ar" ? "أدخل كلمة المرور" : "Enter your password"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableMfa}
              disabled={!disablePassword || disableMutation.isPending}
            >
              {locale === "ar" ? "تعطيل" : "Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog (for regeneration) */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {locale === "ar" ? "رموز احتياطية جديدة" : "New Backup Codes"}
            </DialogTitle>
            <DialogDescription>
              {locale === "ar"
                ? "احفظ هذه الرموز بأمان. الرموز القديمة لم تعد صالحة"
                : "Save these codes securely. Your old codes are no longer valid"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg font-mono text-sm">
            {backupCodes.map((code, index) => (
              <div key={index} className="p-2 bg-white dark:bg-gray-900 rounded">
                {code}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copyBackupCodes}>
              <Copy className="h-4 w-4 me-2" />
              {locale === "ar" ? "نسخ" : "Copy"}
            </Button>
            <Button variant="outline" onClick={downloadBackupCodes}>
              <Download className="h-4 w-4 me-2" />
              {locale === "ar" ? "تحميل" : "Download"}
            </Button>
            <Button onClick={() => setShowBackupCodesDialog(false)}>
              {locale === "ar" ? "حسناً" : "Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
