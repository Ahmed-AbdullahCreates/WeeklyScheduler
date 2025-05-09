import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - Admin and Teacher users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  isAdmin: true,
});

// Grades table (e.g., Grade 1, Grade 2, etc.)
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertGradeSchema = createInsertSchema(grades).pick({
  name: true,
});

// Subjects table (e.g., Math, Science, English, etc.)
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  name: true,
});

// Teacher-Grade assignments
export const teacherGrades = pgTable("teacher_grades", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  gradeId: integer("grade_id").notNull(),
});

export const insertTeacherGradeSchema = createInsertSchema(teacherGrades).pick({
  teacherId: true,
  gradeId: true,
});

// Teacher-Subject assignments (within specific grades)
export const teacherSubjects = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  gradeId: integer("grade_id").notNull(),
  subjectId: integer("subject_id").notNull(),
});

export const insertTeacherSubjectSchema = createInsertSchema(teacherSubjects).pick({
  teacherId: true,
  gradeId: true,
  subjectId: true,
});

// Active planning weeks
export const planningWeeks = pgTable("planning_weeks", {
  id: serial("id").primaryKey(),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertPlanningWeekSchema = createInsertSchema(planningWeeks).pick({
  weekNumber: true,
  year: true,
  startDate: true,
  endDate: true,
  isActive: true,
});

// Weekly plans
export const weeklyPlans = pgTable("weekly_plans", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  gradeId: integer("grade_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  weekId: integer("week_id").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWeeklyPlanSchema = createInsertSchema(weeklyPlans).pick({
  teacherId: true,
  gradeId: true,
  subjectId: true,
  weekId: true,
  notes: true,
});

// Daily plan entries (within weekly plans)
export const dailyPlans = pgTable("daily_plans", {
  id: serial("id").primaryKey(),
  weeklyPlanId: integer("weekly_plan_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 1=Monday, 2=Tuesday, etc.
  topic: text("topic").notNull(),
  booksAndPages: text("books_and_pages"),
  homework: text("homework"),
  homeworkDueDate: date("homework_due_date"),
  assignments: text("assignments"),
  notes: text("notes"),
});

// Create a more robust schema for daily plans with proper validation
export const insertDailyPlanSchema = createInsertSchema(dailyPlans)
  .pick({
    weeklyPlanId: true,
    dayOfWeek: true,
    topic: true,
    booksAndPages: true,
    homework: true,
    homeworkDueDate: true,
    assignments: true,
    notes: true,
  })
  .extend({
    // Ensure topic is always provided and has a reasonable length
    topic: z.string().min(1, "Topic is required").max(500, "Topic is too long"),
    // Make all other fields truly optional with empty string fallbacks
    booksAndPages: z.string().optional().nullable().transform(v => v || ""),
    homework: z.string().optional().nullable().transform(v => v || ""),
    homeworkDueDate: z.string().optional().nullable().transform(v => v || ""),
    assignments: z.string().optional().nullable().transform(v => v || ""),
    notes: z.string().optional().nullable().transform(v => v || ""),
  });

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;

export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export type InsertTeacherGrade = z.infer<typeof insertTeacherGradeSchema>;
export type TeacherGrade = typeof teacherGrades.$inferSelect;

export type InsertTeacherSubject = z.infer<typeof insertTeacherSubjectSchema>;
export type TeacherSubject = typeof teacherSubjects.$inferSelect;

export type InsertPlanningWeek = z.infer<typeof insertPlanningWeekSchema>;
export type PlanningWeek = typeof planningWeeks.$inferSelect;

export type InsertWeeklyPlan = z.infer<typeof insertWeeklyPlanSchema>;
export type WeeklyPlan = typeof weeklyPlans.$inferSelect;

export type InsertDailyPlan = z.infer<typeof insertDailyPlanSchema>;
export type DailyPlan = typeof dailyPlans.$inferSelect;

// Extended schemas and types for frontend use
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const userRoleSchema = z.object({
  isAdmin: z.boolean(),
});

export type UserRoleData = z.infer<typeof userRoleSchema>;

// Extended types for joined data
export type TeacherWithAssignments = User & {
  grades: Grade[];
  subjects: { [gradeId: number]: Subject[] };
};

export type WeeklyPlanWithDetails = WeeklyPlan & {
  teacher: User;
  grade: Grade;
  subject: Subject;
  week: PlanningWeek;
  dailyPlans: DailyPlan[];
};

export type GradeWithSubjects = Grade & {
  subjects: Subject[];
};

export type DailyPlanData = {
  monday?: DailyPlan;
  tuesday?: DailyPlan;
  wednesday?: DailyPlan;
  thursday?: DailyPlan;
  friday?: DailyPlan;
};

export type WeeklyPlanComplete = {
  weeklyPlan: WeeklyPlan;
  dailyPlans: DailyPlanData;
};
