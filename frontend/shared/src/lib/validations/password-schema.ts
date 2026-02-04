import { z } from "zod";

/**
 * Password validation schema that matches backend password policy.
 *
 * Requirements:
 * - Minimum 8 characters (12 for platform users)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

export const platformPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

/**
 * Gets the appropriate password schema based on user type.
 */
export function getPasswordSchema(isPlatformUser: boolean = false) {
  return isPlatformUser ? platformPasswordSchema : passwordSchema;
}

/**
 * Password strength requirements for display.
 */
export interface PasswordRequirement {
  id: string;
  label: string;
  labelAr: string;
  test: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    labelAr: "8 أحرف على الأقل",
    test: (pwd) => pwd.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    labelAr: "حرف كبير واحد",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    labelAr: "حرف صغير واحد",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    id: "number",
    label: "One number",
    labelAr: "رقم واحد",
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    id: "special",
    label: "One special character (!@#$%^&*)",
    labelAr: "رمز خاص واحد (!@#$%^&*)",
    test: (pwd) => /[^A-Za-z0-9]/.test(pwd),
  },
];

export const platformPasswordRequirements: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 12 characters",
    labelAr: "12 حرفًا على الأقل",
    test: (pwd) => pwd.length >= 12,
  },
  ...passwordRequirements.slice(1), // Rest of the requirements are the same
];

/**
 * Gets password requirements based on user type.
 */
export function getPasswordRequirements(isPlatformUser: boolean = false) {
  return isPlatformUser ? platformPasswordRequirements : passwordRequirements;
}

/**
 * Calculates local password strength score (0-100).
 * This is a client-side approximation. The server also validates.
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;

  // Length score (up to 40 points)
  if (password.length >= 16) score += 40;
  else if (password.length >= 12) score += 30;
  else if (password.length >= 8) score += 20;
  else score += password.length * 2;

  // Complexity score (up to 40 points)
  if (/[A-Z]/.test(password)) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;

  // Variety score (up to 20 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 12) score += 20;
  else if (uniqueChars >= 8) score += 15;
  else if (uniqueChars >= 6) score += 10;
  else score += 5;

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Gets password strength label and color based on score.
 */
export function getPasswordStrengthInfo(score: number): {
  label: string;
  labelAr: string;
  color: string;
} {
  if (score >= 80) {
    return {
      label: "Very Strong",
      labelAr: "قوي جدًا",
      color: "text-green-600",
    };
  } else if (score >= 60) {
    return { label: "Strong", labelAr: "قوي", color: "text-green-500" };
  } else if (score >= 40) {
    return { label: "Medium", labelAr: "متوسط", color: "text-yellow-500" };
  } else if (score >= 20) {
    return { label: "Weak", labelAr: "ضعيف", color: "text-orange-500" };
  } else {
    return {
      label: "Very Weak",
      labelAr: "ضعيف جدًا",
      color: "text-red-500",
    };
  }
}
