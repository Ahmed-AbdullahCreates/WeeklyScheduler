import { users, User, InsertUser, Grade, InsertGrade, grades, subjects, InsertSubject, Subject, teacherGrades, TeacherGrade, InsertTeacherGrade, teacherSubjects, TeacherSubject, InsertTeacherSubject, PlanningWeek, planningWeeks, InsertPlanningWeek, WeeklyPlan, weeklyPlans, InsertWeeklyPlan, DailyPlan, dailyPlans, InsertDailyPlan, GradeWithSubjects, TeacherWithAssignments, WeeklyPlanWithDetails, DailyPlanData, WeeklyPlanComplete, planHistory, PlanHistory, InsertPlanHistory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { neon, neonConfig } from '@neondatabase/serverless';
import pg from 'pg';
const { Pool } = pg;
import { eq, and, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

// Setup PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PostgresSessionStore = connectPgSimple(session);
const MemoryStore = createMemoryStore(session);

// Define a type for recent assignments
export type RecentAssignment = {
  teacherId: number;
  teacherName: string;
  gradeId: number;
  gradeName: string;
  subjectId?: number;
  subjectName?: string;
  assignedDate: string;
  type: 'grade' | 'subject';
};

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  updateUserRole(id: number, isAdmin: boolean): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getTeachers(): Promise<User[]>;
  
  // Grade management
  createGrade(grade: InsertGrade): Promise<Grade>;
  getGradeById(id: number): Promise<Grade | undefined>;
  getAllGrades(): Promise<Grade[]>;
  updateGrade(id: number, grade: InsertGrade): Promise<Grade | undefined>;
  deleteGrade(id: number): Promise<boolean>;
  
  // Subject management
  createSubject(subject: InsertSubject): Promise<Subject>;
  getSubjectById(id: number): Promise<Subject | undefined>;
  getAllSubjects(): Promise<Subject[]>;
  updateSubject(id: number, subject: InsertSubject): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;
  
  // Teacher-Grade assignments
  assignTeacherToGrade(teacherGrade: InsertTeacherGrade): Promise<TeacherGrade>;
  getTeacherGrades(teacherId: number): Promise<Grade[]>;
  removeTeacherFromGrade(teacherId: number, gradeId: number): Promise<boolean>;
  getTeachersForGrade(gradeId: number): Promise<User[]>;
  getRecentTeacherAssignments(): Promise<RecentAssignment[]>;
  
  // Teacher-Subject assignments
  assignTeacherToSubject(teacherSubject: InsertTeacherSubject): Promise<TeacherSubject>;
  getTeacherSubjects(teacherId: number, gradeId: number): Promise<Subject[]>;
  removeTeacherFromSubject(teacherId: number, gradeId: number, subjectId: number): Promise<boolean>;
  
  // Planning weeks
  createPlanningWeek(week: InsertPlanningWeek): Promise<PlanningWeek>;
  getPlanningWeekById(id: number): Promise<PlanningWeek | undefined>;
  getAllPlanningWeeks(): Promise<PlanningWeek[]>;
  getActivePlanningWeeks(): Promise<PlanningWeek[]>;
  togglePlanningWeekStatus(id: number): Promise<PlanningWeek | undefined>;
  deletePlanningWeek(id: number): Promise<boolean>;
  
  // Weekly plans
  createWeeklyPlan(plan: InsertWeeklyPlan): Promise<WeeklyPlan>;
  getWeeklyPlanById(id: number): Promise<WeeklyPlan | undefined>;
  getWeeklyPlansByTeacher(teacherId: number): Promise<WeeklyPlan[]>;
  getWeeklyPlansByGrade(gradeId: number): Promise<WeeklyPlan[]>;
  getWeeklyPlansByWeek(weekId: number): Promise<WeeklyPlan[]>;
  getWeeklyPlansByGradeAndWeek(gradeId: number, weekId: number): Promise<WeeklyPlanWithDetails[]>;
  getWeeklyPlanComplete(planId: number): Promise<WeeklyPlanComplete | undefined>;
  getTeacherFullData(teacherId: number): Promise<TeacherWithAssignments | undefined>;
  
  // Daily plans
  createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan>;
  getDailyPlanById(id: number): Promise<DailyPlan | undefined>;
  getDailyPlansByWeeklyPlan(weeklyPlanId: number): Promise<DailyPlan[]>;
  updateDailyPlan(id: number, plan: Partial<InsertDailyPlan>): Promise<DailyPlan | undefined>;
  
  // Plan history
  addPlanHistory(history: InsertPlanHistory): Promise<PlanHistory>;
  getPlanHistoryByWeeklyPlanId(weeklyPlanId: number): Promise<PlanHistory[]>;
  getPlanHistoryByTeacherId(teacherId: number): Promise<PlanHistory[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private grades: Map<number, Grade>;
  private subjects: Map<number, Subject>;
  private teacherGrades: Map<number, TeacherGrade>;
  private teacherSubjects: Map<number, TeacherSubject>;
  private planningWeeks: Map<number, PlanningWeek>;
  private weeklyPlans: Map<number, WeeklyPlan>;
  private dailyPlans: Map<number, DailyPlan>;
  private planHistories: Map<number, PlanHistory>;
  
  private userIdCounter: number;
  private gradeIdCounter: number;
  private subjectIdCounter: number;
  private teacherGradeIdCounter: number;
  private teacherSubjectIdCounter: number;
  private planningWeekIdCounter: number;
  private weeklyPlanIdCounter: number;
  private dailyPlanIdCounter: number;
  private planHistoryIdCounter: number;
  
  sessionStore: session.Store;
  
  constructor() {
    this.users = new Map();
    this.grades = new Map();
    this.subjects = new Map();
    this.teacherGrades = new Map();
    this.teacherSubjects = new Map();
    this.planningWeeks = new Map();
    this.weeklyPlans = new Map();
    this.dailyPlans = new Map();
    this.planHistories = new Map();
    
    this.userIdCounter = 1;
    this.gradeIdCounter = 1;
    this.subjectIdCounter = 1;
    this.teacherGradeIdCounter = 1;
    this.teacherSubjectIdCounter = 1;
    this.planningWeekIdCounter = 1;
    this.weeklyPlanIdCounter = 1;
    this.dailyPlanIdCounter = 1;
    this.planHistoryIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "password", // This will be hashed in auth.ts
      fullName: "Admin User",
      isAdmin: true
    });
  }
  
  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || null,
      isAdmin: insertUser.isAdmin || false 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getTeachers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => !user.isAdmin);
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Don't allow deleting the last admin
    const user = this.users.get(id);
    if (!user) return false;
    
    if (user.isAdmin) {
      // Check if this is the last admin
      const admins = Array.from(this.users.values()).filter(u => u.isAdmin);
      if (admins.length <= 1) {
        return false; // Can't delete the last admin
      }
    }
    
    // Delete any associated teacher-grade and teacher-subject relationships
    Array.from(this.teacherGrades.values())
      .filter(tg => tg.teacherId === id)
      .forEach(tg => this.teacherGrades.delete(tg.id));
      
    Array.from(this.teacherSubjects.values())
      .filter(ts => ts.teacherId === id)
      .forEach(ts => this.teacherSubjects.delete(ts.id));
    
    // Delete any associated weekly plans and daily plans
    const weeklyPlanIds = Array.from(this.weeklyPlans.values())
      .filter(wp => wp.teacherId === id)
      .map(wp => wp.id);
      
    weeklyPlanIds.forEach(wpId => {
      // Delete associated daily plans
      Array.from(this.dailyPlans.values())
        .filter(dp => dp.weeklyPlanId === wpId)
        .forEach(dp => this.dailyPlans.delete(dp.id));
        
      // Delete the weekly plan
      this.weeklyPlans.delete(wpId);
    });
    
    // Finally delete the user
    return this.users.delete(id);
  }
  
  async updateUserRole(id: number, isAdmin: boolean): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // If we're removing admin role, make sure this isn't the last admin
    if (user.isAdmin && !isAdmin) {
      const admins = Array.from(this.users.values()).filter(u => u.isAdmin);
      if (admins.length <= 1) {
        return undefined; // Can't remove admin status from the last admin
      }
    }
    
    const updatedUser = { ...user, isAdmin };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Grade management
  async createGrade(insertGrade: InsertGrade): Promise<Grade> {
    const id = this.gradeIdCounter++;
    const grade: Grade = { ...insertGrade, id };
    this.grades.set(id, grade);
    return grade;
  }
  
  async getGradeById(id: number): Promise<Grade | undefined> {
    return this.grades.get(id);
  }
  
  async getAllGrades(): Promise<Grade[]> {
    return Array.from(this.grades.values());
  }
  
  async updateGrade(id: number, grade: InsertGrade): Promise<Grade | undefined> {
    const existingGrade = this.grades.get(id);
    if (!existingGrade) return undefined;
    
    const updatedGrade = { ...existingGrade, ...grade };
    this.grades.set(id, updatedGrade);
    return updatedGrade;
  }
  
  async deleteGrade(id: number): Promise<boolean> {
    return this.grades.delete(id);
  }
  
  // Subject management
  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = this.subjectIdCounter++;
    const subject: Subject = { ...insertSubject, id };
    this.subjects.set(id, subject);
    return subject;
  }
  
  async getSubjectById(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }
  
  async getAllSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }
  
  async updateSubject(id: number, subject: InsertSubject): Promise<Subject | undefined> {
    const existingSubject = this.subjects.get(id);
    if (!existingSubject) return undefined;
    
    const updatedSubject = { ...existingSubject, ...subject };
    this.subjects.set(id, updatedSubject);
    return updatedSubject;
  }
  
  async deleteSubject(id: number): Promise<boolean> {
    return this.subjects.delete(id);
  }
  
  // Teacher-Grade assignments
  async assignTeacherToGrade(teacherGrade: InsertTeacherGrade): Promise<TeacherGrade> {
    // Check for existing assignment
    const existing = Array.from(this.teacherGrades.values()).find(
      tg => tg.teacherId === teacherGrade.teacherId && tg.gradeId === teacherGrade.gradeId
    );
    
    if (existing) return existing;
    
    const id = this.teacherGradeIdCounter++;
    const newTeacherGrade: TeacherGrade = { ...teacherGrade, id };
    this.teacherGrades.set(id, newTeacherGrade);
    return newTeacherGrade;
  }
  
  async getTeacherGrades(teacherId: number): Promise<Grade[]> {
    const gradeIds = Array.from(this.teacherGrades.values())
      .filter(tg => tg.teacherId === teacherId)
      .map(tg => tg.gradeId);
    
    return gradeIds.map(id => this.grades.get(id)).filter(Boolean) as Grade[];
  }
  
  async removeTeacherFromGrade(teacherId: number, gradeId: number): Promise<boolean> {
    const teacherGrade = Array.from(this.teacherGrades.values()).find(
      tg => tg.teacherId === teacherId && tg.gradeId === gradeId
    );
    
    if (!teacherGrade) return false;
    
    return this.teacherGrades.delete(teacherGrade.id);
  }
  
  async getTeachersForGrade(gradeId: number): Promise<User[]> {
    const teacherIds = Array.from(this.teacherGrades.values())
      .filter(tg => tg.gradeId === gradeId)
      .map(tg => tg.teacherId);
    
    return teacherIds.map(id => this.users.get(id)).filter(Boolean) as User[];
  }

  async getRecentTeacherAssignments(): Promise<RecentAssignment[]> {
    const recentGradeAssignments = Array.from(this.teacherGrades.values())
      .sort((a, b) => b.id - a.id) // Sort by id descending to get most recent
      .slice(0, 3) // Limit to 3 most recent
      .map(async (tg): Promise<RecentAssignment> => {
        const teacher = await this.getUser(tg.teacherId);
        const grade = await this.getGradeById(tg.gradeId);
        
        if (!teacher || !grade) {
          throw new Error("Missing teacher or grade data");
        }
        
        return {
          teacherId: tg.teacherId,
          teacherName: teacher.fullName,
          gradeId: tg.gradeId,
          gradeName: grade.name,
          assignedDate: new Date().toISOString().split('T')[0], // Current date as YYYY-MM-DD
          type: 'grade'
        };
      });
    
    const recentSubjectAssignments = Array.from(this.teacherSubjects.values())
      .sort((a, b) => b.id - a.id) // Sort by id descending to get most recent
      .slice(0, 3) // Limit to 3 most recent
      .map(async (ts): Promise<RecentAssignment> => {
        const teacher = await this.getUser(ts.teacherId);
        const grade = await this.getGradeById(ts.gradeId);
        const subject = await this.getSubjectById(ts.subjectId);
        
        if (!teacher || !grade || !subject) {
          throw new Error("Missing teacher, grade or subject data");
        }
        
        return {
          teacherId: ts.teacherId,
          teacherName: teacher.fullName,
          gradeId: ts.gradeId,
          gradeName: grade.name,
          subjectId: ts.subjectId,
          subjectName: subject.name,
          assignedDate: new Date().toISOString().split('T')[0], // Current date as YYYY-MM-DD
          type: 'subject'
        };
      });
    
    // Combine and sort by most recent
    const combinedAssignments = await Promise.all([
      ...recentGradeAssignments,
      ...recentSubjectAssignments
    ]);
    
    return combinedAssignments.slice(0, 5); // Return up to 5 most recent assignments
  }
  
  // Teacher-Subject assignments
  async assignTeacherToSubject(teacherSubject: InsertTeacherSubject): Promise<TeacherSubject> {
    // Check for existing assignment
    const existing = Array.from(this.teacherSubjects.values()).find(
      ts => ts.teacherId === teacherSubject.teacherId && 
           ts.gradeId === teacherSubject.gradeId && 
           ts.subjectId === teacherSubject.subjectId
    );
    
    if (existing) return existing;
    
    const id = this.teacherSubjectIdCounter++;
    const newTeacherSubject: TeacherSubject = { ...teacherSubject, id };
    this.teacherSubjects.set(id, newTeacherSubject);
    return newTeacherSubject;
  }
  
  async getTeacherSubjects(teacherId: number, gradeId: number): Promise<Subject[]> {
    const subjectIds = Array.from(this.teacherSubjects.values())
      .filter(ts => ts.teacherId === teacherId && ts.gradeId === gradeId)
      .map(ts => ts.subjectId);
    
    return subjectIds.map(id => this.subjects.get(id)).filter(Boolean) as Subject[];
  }
  
  async removeTeacherFromSubject(teacherId: number, gradeId: number, subjectId: number): Promise<boolean> {
    const teacherSubject = Array.from(this.teacherSubjects.values()).find(
      ts => ts.teacherId === teacherId && ts.gradeId === gradeId && ts.subjectId === subjectId
    );
    
    if (!teacherSubject) return false;
    
    return this.teacherSubjects.delete(teacherSubject.id);
  }
  
  // Planning weeks
  async createPlanningWeek(week: InsertPlanningWeek): Promise<PlanningWeek> {
    const id = this.planningWeekIdCounter++;
    const planningWeek: PlanningWeek = { 
      ...week, 
      id,
      isActive: week.isActive ?? true 
    };
    this.planningWeeks.set(id, planningWeek);
    return planningWeek;
  }
  
  async getPlanningWeekById(id: number): Promise<PlanningWeek | undefined> {
    return this.planningWeeks.get(id);
  }
  
  async getAllPlanningWeeks(): Promise<PlanningWeek[]> {
    return Array.from(this.planningWeeks.values())
      .sort((a, b) => {
        // Sort by year and then by week number
        if (a.year !== b.year) return b.year - a.year;
        return b.weekNumber - a.weekNumber;
      });
  }
  
  async getActivePlanningWeeks(): Promise<PlanningWeek[]> {
    return Array.from(this.planningWeeks.values())
      .filter(week => week.isActive)
      .sort((a, b) => {
        // Sort by year and then by week number
        if (a.year !== b.year) return b.year - a.year;
        return b.weekNumber - a.weekNumber;
      });
  }
  
  async togglePlanningWeekStatus(id: number): Promise<PlanningWeek | undefined> {
    const week = this.planningWeeks.get(id);
    if (!week) return undefined;
    
    const updatedWeek = { ...week, isActive: !week.isActive };
    this.planningWeeks.set(id, updatedWeek);
    return updatedWeek;
  }
  
  async deletePlanningWeek(id: number): Promise<boolean> {
    // Check if the week exists
    const week = this.planningWeeks.get(id);
    if (!week) return false;
    
    // Check if there are any weekly plans for this week
    const weeklyPlans = Array.from(this.weeklyPlans.values())
      .filter(plan => plan.weekId === id);
      
    if (weeklyPlans.length > 0) {
      return false; // Cannot delete weeks that have associated plans
    }
    
    return this.planningWeeks.delete(id);
  }
  
  // Weekly plans
  async createWeeklyPlan(plan: InsertWeeklyPlan): Promise<WeeklyPlan> {
    const id = this.weeklyPlanIdCounter++;
    const now = new Date();
    const weeklyPlan: WeeklyPlan = { 
      ...plan, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.weeklyPlans.set(id, weeklyPlan);
    return weeklyPlan;
  }
  
  async getWeeklyPlanById(id: number): Promise<WeeklyPlan | undefined> {
    return this.weeklyPlans.get(id);
  }
  
  async getWeeklyPlansByTeacher(teacherId: number): Promise<WeeklyPlan[]> {
    return Array.from(this.weeklyPlans.values())
      .filter(plan => plan.teacherId === teacherId);
  }
  
  async getWeeklyPlansByGrade(gradeId: number): Promise<WeeklyPlan[]> {
    return Array.from(this.weeklyPlans.values())
      .filter(plan => plan.gradeId === gradeId);
  }
  
  async getWeeklyPlansByWeek(weekId: number): Promise<WeeklyPlan[]> {
    return Array.from(this.weeklyPlans.values())
      .filter(plan => plan.weekId === weekId);
  }
  
  async getWeeklyPlansByGradeAndWeek(gradeId: number, weekId: number): Promise<WeeklyPlanWithDetails[]> {
    const plans = Array.from(this.weeklyPlans.values())
      .filter(plan => plan.gradeId === gradeId && plan.weekId === weekId);
    
    return Promise.all(plans.map(async (plan: WeeklyPlan) => {
      const teacher = await this.getUser(plan.teacherId);
      const grade = await this.getGradeById(plan.gradeId);
      const subject = await this.getSubjectById(plan.subjectId);
      const week = await this.getPlanningWeekById(plan.weekId);
      const dailyPlans = await this.getDailyPlansByWeeklyPlan(plan.id);
      
      if (!teacher || !grade || !subject || !week) {
        throw new Error("Missing related data for weekly plan");
      }
      
      return {
        ...plan,
        teacher,
        grade,
        subject,
        week,
        dailyPlans
      };
    }));
  }
  
  async getWeeklyPlanComplete(planId: number): Promise<WeeklyPlanComplete | undefined> {
    const weeklyPlan = this.weeklyPlans.get(planId);
    if (!weeklyPlan) return undefined;
    
    const allDailyPlans = await this.getDailyPlansByWeeklyPlan(planId);
    
    const dailyPlans: DailyPlanData = {
      monday: allDailyPlans.find(dp => dp.dayOfWeek === 1),
      tuesday: allDailyPlans.find(dp => dp.dayOfWeek === 2),
      wednesday: allDailyPlans.find(dp => dp.dayOfWeek === 3),
      thursday: allDailyPlans.find(dp => dp.dayOfWeek === 4),
      friday: allDailyPlans.find(dp => dp.dayOfWeek === 5),
    };
    
    return {
      weeklyPlan,
      dailyPlans
    };
  }
  
  async getTeacherFullData(teacherId: number): Promise<TeacherWithAssignments | undefined> {
    const teacher = await this.getUser(teacherId);
    if (!teacher) return undefined;
    
    const grades = await this.getTeacherGrades(teacherId);
    
    const subjects: { [gradeId: number]: Subject[] } = {};
    
    for (const grade of grades) {
      subjects[grade.id] = await this.getTeacherSubjects(teacherId, grade.id);
    }
    
    return {
      ...teacher,
      grades,
      subjects
    };
  }
  
  // Daily plans
  async createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan> {
    const id = this.dailyPlanIdCounter++;
    const dailyPlan: DailyPlan = { 
      ...plan, 
      id,
      booksAndPages: plan.booksAndPages ?? null,
      homework: plan.homework ?? null,
      homeworkDueDate: plan.homeworkDueDate ?? null,
      assignments: plan.assignments ?? null,
      notes: plan.notes ?? null
    };
    this.dailyPlans.set(id, dailyPlan);
    return dailyPlan;
  }
  
  async getDailyPlanById(id: number): Promise<DailyPlan | undefined> {
    return this.dailyPlans.get(id);
  }
  
  async getDailyPlansByWeeklyPlan(weeklyPlanId: number): Promise<DailyPlan[]> {
    return Array.from(this.dailyPlans.values())
      .filter(plan => plan.weeklyPlanId === weeklyPlanId);
  }
  
  async updateDailyPlan(id: number, plan: Partial<InsertDailyPlan>): Promise<DailyPlan | undefined> {
    const existingPlan = this.dailyPlans.get(id);
    if (!existingPlan) return undefined;
    
    const updatedPlan = { ...existingPlan, ...plan };
    this.dailyPlans.set(id, updatedPlan);
    return updatedPlan;
  }
  
  // Plan history
  async addPlanHistory(history: InsertPlanHistory): Promise<PlanHistory> {
    const id = this.planHistoryIdCounter++;
    const timestamp = new Date();
    
    const planHistory: PlanHistory = {
      ...history,
      id,
      timestamp
    };
    
    this.planHistories.set(id, planHistory);
    return planHistory;
  }
  
  async getPlanHistoryByWeeklyPlanId(weeklyPlanId: number): Promise<PlanHistory[]> {
    return Array.from(this.planHistories.values())
      .filter(history => history.weeklyPlanId === weeklyPlanId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Most recent first
  }
  
  async getPlanHistoryByTeacherId(teacherId: number): Promise<PlanHistory[]> {
    return Array.from(this.planHistories.values())
      .filter(history => history.teacherId === teacherId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Most recent first
  }
}

// Create a PostgreSQL-backed storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  private db: any;

  constructor() {
    // Create PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Initialize neon client for serverless PostgreSQL
    neonConfig.fetchConnectionCache = true;
    const client = neon(process.env.DATABASE_URL!);
    this.db = drizzle(client);
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result.length ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result.length ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const insertedUser = await this.db.insert(users).values(user).returning();
    return insertedUser[0];
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const updatedUser = await this.db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser.length ? updatedUser[0] : undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getTeachers(): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.isAdmin, false));
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      // First check if this is the last admin
      if ((await this.getUser(id))?.isAdmin) {
        const admins = await this.db.select().from(users).where(eq(users.isAdmin, true));
        if (admins.length <= 1) {
          return false; // Can't delete the last admin
        }
      }
      
      // Start a transaction to handle all related deletions
      // Database will cascade delete all related records thanks to foreign key constraints
      const result = await this.db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  
  async updateUserRole(id: number, isAdmin: boolean): Promise<User | undefined> {
    try {
      // If we're removing admin status, make sure this isn't the last admin
      if (!isAdmin) {
        const user = await this.getUser(id);
        if (user?.isAdmin) {
          const admins = await this.db.select().from(users).where(eq(users.isAdmin, true));
          if (admins.length <= 1) {
            return undefined; // Can't remove admin status from the last admin
          }
        }
      }
      
      const updatedUser = await this.db.update(users)
        .set({ isAdmin })
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser.length ? updatedUser[0] : undefined;
    } catch (error) {
      console.error("Error updating user role:", error);
      return undefined;
    }
  }

  // Grade management
  async createGrade(grade: InsertGrade): Promise<Grade> {
    const insertedGrade = await this.db.insert(grades).values(grade).returning();
    return insertedGrade[0];
  }

  async getGradeById(id: number): Promise<Grade | undefined> {
    const result = await this.db.select().from(grades).where(eq(grades.id, id));
    return result.length ? result[0] : undefined;
  }

  async getAllGrades(): Promise<Grade[]> {
    return await this.db.select().from(grades);
  }

  async updateGrade(id: number, grade: InsertGrade): Promise<Grade | undefined> {
    const updatedGrade = await this.db.update(grades)
      .set(grade)
      .where(eq(grades.id, id))
      .returning();
    return updatedGrade.length ? updatedGrade[0] : undefined;
  }

  async deleteGrade(id: number): Promise<boolean> {
    const result = await this.db.delete(grades).where(eq(grades.id, id));
    return !!result;
  }

  // Subject management
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const insertedSubject = await this.db.insert(subjects).values(subject).returning();
    return insertedSubject[0];
  }

  async getSubjectById(id: number): Promise<Subject | undefined> {
    const result = await this.db.select().from(subjects).where(eq(subjects.id, id));
    return result.length ? result[0] : undefined;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await this.db.select().from(subjects);
  }

  async updateSubject(id: number, subject: InsertSubject): Promise<Subject | undefined> {
    const updatedSubject = await this.db.update(subjects)
      .set(subject)
      .where(eq(subjects.id, id))
      .returning();
    return updatedSubject.length ? updatedSubject[0] : undefined;
  }

  async deleteSubject(id: number): Promise<boolean> {
    const result = await this.db.delete(subjects).where(eq(subjects.id, id));
    return !!result;
  }

  // Teacher-Grade assignments
  async assignTeacherToGrade(teacherGrade: InsertTeacherGrade): Promise<TeacherGrade> {
    // Check if assignment already exists
    const existing = await this.db.select()
      .from(teacherGrades)
      .where(and(
        eq(teacherGrades.teacherId, teacherGrade.teacherId),
        eq(teacherGrades.gradeId, teacherGrade.gradeId)
      ));
    
    if (existing.length) return existing[0];
    
    // Create new assignment
    const inserted = await this.db.insert(teacherGrades)
      .values(teacherGrade)
      .returning();
    return inserted[0];
  }

  async getTeacherGrades(teacherId: number): Promise<Grade[]> {
    const assignments = await this.db.select({
      grade: grades
    })
    .from(teacherGrades)
    .where(eq(teacherGrades.teacherId, teacherId))
    .innerJoin(grades, eq(teacherGrades.gradeId, grades.id));

    return assignments.map((a: any) => a.grade);
  }

  async removeTeacherFromGrade(teacherId: number, gradeId: number): Promise<boolean> {
    const result = await this.db.delete(teacherGrades)
      .where(and(
        eq(teacherGrades.teacherId, teacherId),
        eq(teacherGrades.gradeId, gradeId)
      ));
    return !!result;
  }

  async getTeachersForGrade(gradeId: number): Promise<User[]> {
    const assignments = await this.db.select({
      teacher: users
    })
    .from(teacherGrades)
    .where(eq(teacherGrades.gradeId, gradeId))
    .innerJoin(users, eq(teacherGrades.teacherId, users.id));

    return assignments.map((a: any) => a.teacher);
  }
  
  async getRecentTeacherAssignments(): Promise<RecentAssignment[]> {
    // Get recent grade assignments
    const recentGradeAssignments = await this.db.select({
      id: teacherGrades.id,
      teacherId: teacherGrades.teacherId,
      teacherName: users.fullName,
      gradeId: teacherGrades.gradeId,
      gradeName: grades.name
    })
    .from(teacherGrades)
    .innerJoin(users, eq(teacherGrades.teacherId, users.id))
    .innerJoin(grades, eq(teacherGrades.gradeId, grades.id))
    .orderBy(desc(teacherGrades.id))
    .limit(3);
    
    // Get recent subject assignments
    const recentSubjectAssignments = await this.db.select({
      id: teacherSubjects.id,
      teacherId: teacherSubjects.teacherId,
      teacherName: users.fullName,
      gradeId: teacherSubjects.gradeId,
      gradeName: grades.name,
      subjectId: teacherSubjects.subjectId,
      subjectName: subjects.name
    })
    .from(teacherSubjects)
    .innerJoin(users, eq(teacherSubjects.teacherId, users.id))
    .innerJoin(grades, eq(teacherSubjects.gradeId, grades.id))
    .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
    .orderBy(desc(teacherSubjects.id))
    .limit(3);
    
    // Transform grade assignments to RecentAssignment format
    const gradeAssignments = recentGradeAssignments.map((assignment: any) => ({
      teacherId: assignment.teacherId,
      teacherName: assignment.teacherName,
      gradeId: assignment.gradeId,
      gradeName: assignment.gradeName,
      assignedDate: new Date().toISOString().split('T')[0], // Current date as YYYY-MM-DD
      type: 'grade' as const
    }));
    
    // Transform subject assignments to RecentAssignment format
    const subjectAssignments = recentSubjectAssignments.map((assignment: any) => ({
      teacherId: assignment.teacherId,
      teacherName: assignment.teacherName,
      gradeId: assignment.gradeId,
      gradeName: assignment.gradeName,
      subjectId: assignment.subjectId,
      subjectName: assignment.subjectName,
      assignedDate: new Date().toISOString().split('T')[0], // Current date as YYYY-MM-DD
      type: 'subject' as const
    }));
    
    // Combine and return up to 5 most recent assignments
    return [...gradeAssignments, ...subjectAssignments]
      .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())
      .slice(0, 5);
  }

  // Teacher-Subject assignments
  async assignTeacherToSubject(teacherSubject: InsertTeacherSubject): Promise<TeacherSubject> {
    // Check if assignment already exists
    const existing = await this.db.select()
      .from(teacherSubjects)
      .where(and(
        eq(teacherSubjects.teacherId, teacherSubject.teacherId),
        eq(teacherSubjects.gradeId, teacherSubject.gradeId),
        eq(teacherSubjects.subjectId, teacherSubject.subjectId)
      ));
    
    if (existing.length) return existing[0];
    
    // Create new assignment
    const inserted = await this.db.insert(teacherSubjects)
      .values(teacherSubject)
      .returning();
    return inserted[0];
  }

  async getTeacherSubjects(teacherId: number, gradeId: number): Promise<Subject[]> {
    const assignments = await this.db.select({
      subject: subjects
    })
    .from(teacherSubjects)
    .where(and(
      eq(teacherSubjects.teacherId, teacherId),
      eq(teacherSubjects.gradeId, gradeId)
    ))
    .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id));

    return assignments.map((a: any) => a.subject);
  }

  async removeTeacherFromSubject(teacherId: number, gradeId: number, subjectId: number): Promise<boolean> {
    const result = await this.db.delete(teacherSubjects)
      .where(and(
        eq(teacherSubjects.teacherId, teacherId),
        eq(teacherSubjects.gradeId, gradeId),
        eq(teacherSubjects.subjectId, subjectId)
      ));
    return !!result;
  }

  // Planning weeks
  async createPlanningWeek(week: InsertPlanningWeek): Promise<PlanningWeek> {
    const inserted = await this.db.insert(planningWeeks)
      .values(week)
      .returning();
    return inserted[0];
  }

  async getPlanningWeekById(id: number): Promise<PlanningWeek | undefined> {
    const result = await this.db.select()
      .from(planningWeeks)
      .where(eq(planningWeeks.id, id));
    return result.length ? result[0] : undefined;
  }

  async getAllPlanningWeeks(): Promise<PlanningWeek[]> {
    return await this.db.select()
      .from(planningWeeks)
      .orderBy(desc(planningWeeks.year), desc(planningWeeks.weekNumber));
  }

  async getActivePlanningWeeks(): Promise<PlanningWeek[]> {
    return await this.db.select()
      .from(planningWeeks)
      .where(eq(planningWeeks.isActive, true))
      .orderBy(desc(planningWeeks.year), desc(planningWeeks.weekNumber));
  }

  async togglePlanningWeekStatus(id: number): Promise<PlanningWeek | undefined> {
    const week = await this.getPlanningWeekById(id);
    if (!week) return undefined;
    
    const updated = await this.db.update(planningWeeks)
      .set({ isActive: !week.isActive })
      .where(eq(planningWeeks.id, id))
      .returning();
    
    return updated.length ? updated[0] : undefined;
  }
  
  async deletePlanningWeek(id: number): Promise<boolean> {
    try {
      // Check if there are any weekly plans for this week
      const weeklyPlanResults = await this.getWeeklyPlansByWeek(id);
      
      if (weeklyPlanResults.length > 0) {
        return false; // Cannot delete weeks that have associated plans
      }
      
      const result = await this.db.delete(planningWeeks)
        .where(eq(planningWeeks.id, id));
        
      return !!result;
    } catch (error) {
      console.error("Error deleting planning week:", error);
      return false;
    }
  }

  // Weekly plans
  async createWeeklyPlan(plan: InsertWeeklyPlan): Promise<WeeklyPlan> {
    const now = new Date();
    const inserted = await this.db.insert(weeklyPlans)
      .values({
        ...plan,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return inserted[0];
  }

  async getWeeklyPlanById(id: number): Promise<WeeklyPlan | undefined> {
    const result = await this.db.select()
      .from(weeklyPlans)
      .where(eq(weeklyPlans.id, id));
    return result.length ? result[0] : undefined;
  }

  async getWeeklyPlansByTeacher(teacherId: number): Promise<WeeklyPlan[]> {
    return await this.db.select()
      .from(weeklyPlans)
      .where(eq(weeklyPlans.teacherId, teacherId));
  }

  async getWeeklyPlansByGrade(gradeId: number): Promise<WeeklyPlan[]> {
    return await this.db.select()
      .from(weeklyPlans)
      .where(eq(weeklyPlans.gradeId, gradeId));
  }

  async getWeeklyPlansByWeek(weekId: number): Promise<WeeklyPlan[]> {
    return await this.db.select()
      .from(weeklyPlans)
      .where(eq(weeklyPlans.weekId, weekId));
  }

  async getWeeklyPlansByGradeAndWeek(gradeId: number, weekId: number): Promise<WeeklyPlanWithDetails[]> {
    const plans = await this.db.select()
      .from(weeklyPlans)
      .where(and(
        eq(weeklyPlans.gradeId, gradeId),
        eq(weeklyPlans.weekId, weekId)
      ));
    
    return Promise.all(plans.map(async (plan: WeeklyPlan) => {
      const teacher = await this.getUser(plan.teacherId);
      const grade = await this.getGradeById(plan.gradeId);
      const subject = await this.getSubjectById(plan.subjectId);
      const week = await this.getPlanningWeekById(plan.weekId);
      const dailyPlans = await this.getDailyPlansByWeeklyPlan(plan.id);
      
      if (!teacher || !grade || !subject || !week) {
        throw new Error("Missing related data for weekly plan");
      }
      
      return {
        ...plan,
        teacher,
        grade,
        subject,
        week,
        dailyPlans
      };
    }));
  }

  async getWeeklyPlanComplete(planId: number): Promise<WeeklyPlanComplete | undefined> {
    const weeklyPlan = await this.getWeeklyPlanById(planId);
    if (!weeklyPlan) return undefined;
    
    const allDailyPlans = await this.getDailyPlansByWeeklyPlan(planId);
    
    const dailyPlans: DailyPlanData = {
      monday: allDailyPlans.find(dp => dp.dayOfWeek === 1),
      tuesday: allDailyPlans.find(dp => dp.dayOfWeek === 2),
      wednesday: allDailyPlans.find(dp => dp.dayOfWeek === 3),
      thursday: allDailyPlans.find(dp => dp.dayOfWeek === 4),
      friday: allDailyPlans.find(dp => dp.dayOfWeek === 5),
    };
    
    return {
      weeklyPlan,
      dailyPlans
    };
  }

  async getTeacherFullData(teacherId: number): Promise<TeacherWithAssignments | undefined> {
    const teacher = await this.getUser(teacherId);
    if (!teacher) return undefined;
    
    const grades = await this.getTeacherGrades(teacherId);
    
    const subjects: { [gradeId: number]: Subject[] } = {};
    
    for (const grade of grades) {
      subjects[grade.id] = await this.getTeacherSubjects(teacherId, grade.id);
    }
    
    return {
      ...teacher,
      grades,
      subjects
    };
  }

  // Daily plans
  async createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan> {
    const inserted = await this.db.insert(dailyPlans)
      .values(plan)
      .returning();
    return inserted[0];
  }

  async getDailyPlanById(id: number): Promise<DailyPlan | undefined> {
    const result = await this.db.select()
      .from(dailyPlans)
      .where(eq(dailyPlans.id, id));
    return result.length ? result[0] : undefined;
  }

  async getDailyPlansByWeeklyPlan(weeklyPlanId: number): Promise<DailyPlan[]> {
    return await this.db.select()
      .from(dailyPlans)
      .where(eq(dailyPlans.weeklyPlanId, weeklyPlanId));
  }

  async updateDailyPlan(id: number, plan: Partial<InsertDailyPlan>): Promise<DailyPlan | undefined> {
    const updated = await this.db.update(dailyPlans)
      .set(plan as any) // Type assertion to avoid TypeScript error
      .where(eq(dailyPlans.id, id))
      .returning();
    return updated.length ? updated[0] : undefined;
  }
  
  // Plan history
  async addPlanHistory(history: InsertPlanHistory): Promise<PlanHistory> {
    const inserted = await this.db.insert(planHistory)
      .values(history)
      .returning();
    return inserted[0];
  }
  
  async getPlanHistoryByWeeklyPlanId(weeklyPlanId: number): Promise<PlanHistory[]> {
    return await this.db.select()
      .from(planHistory)
      .where(eq(planHistory.weeklyPlanId, weeklyPlanId))
      .orderBy(desc(planHistory.timestamp));
  }
  
  async getPlanHistoryByTeacherId(teacherId: number): Promise<PlanHistory[]> {
    return await this.db.select()
      .from(planHistory)
      .where(eq(planHistory.teacherId, teacherId))
      .orderBy(desc(planHistory.timestamp));
  }
}

// Choose storage implementation based on environment
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
