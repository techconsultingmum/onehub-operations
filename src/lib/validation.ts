import { z } from "zod";

// Task validation schema
export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .nullable(),
  status: z
    .enum(["todo", "in-progress", "completed"], {
      errorMap: () => ({ message: "Status must be one of: todo, in-progress, completed" }),
    })
    .default("todo"),
  priority: z
    .enum(["low", "medium", "high", "urgent"], {
      errorMap: () => ({ message: "Priority must be one of: low, medium, high, urgent" }),
    })
    .default("medium"),
  due_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Invalid date format" }
    ),
});

// Team member validation schema
export const teamMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  role: z
    .string()
    .trim()
    .min(1, "Role is required")
    .max(50, "Role must be less than 50 characters"),
  department: z
    .string()
    .trim()
    .max(100, "Department must be less than 100 characters")
    .optional()
    .nullable(),
});

// CSV import validation
export const validateTaskRow = (row: Record<string, string>) => {
  const result = taskSchema.safeParse({
    title: row.title || "",
    description: row.description || null,
    status: row.status?.toLowerCase() || "todo",
    priority: row.priority?.toLowerCase() || "medium",
    due_date: row.due_date || null,
  });

  return result;
};

export const validateTeamMemberRow = (row: Record<string, string>) => {
  const result = teamMemberSchema.safeParse({
    name: row.name || "",
    email: row.email || "",
    role: row.role || "",
    department: row.department || null,
  });

  return result;
};

// Webhook URL validation
export const webhookUrlSchema = z
  .string()
  .trim()
  .url("Please enter a valid URL")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "URL must use HTTP or HTTPS protocol" }
  );

// Webhook name validation
export const webhookNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters");

// Generate a secure random string for webhook secrets
export const generateSecretKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export type TaskValidation = z.infer<typeof taskSchema>;
export type TeamMemberValidation = z.infer<typeof teamMemberSchema>;
