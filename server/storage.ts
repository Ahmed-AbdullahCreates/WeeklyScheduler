import { users, User, InsertUser, Grade, InsertGrade, grades, subjects, InsertSubject, Subject, teacherGrades, TeacherGrade, InsertTeacherGrade, teacherSubjects, TeacherSubject, InsertTeacherSubject, PlanningWeek, planningWeeks, InsertPlanningWeek, WeeklyPlan, weeklyPlans, InsertWeeklyPlan, DailyPlan, dailyPlans, InsertDailyPlan, GradeWithSubjects, TeacherWithAssignments, WeeklyPlanWithDetails, DailyPlanData, WeeklyPlanComplete } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
  
  // Session store
  sessionStore: session.SessionStore;
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
  
  private userIdCounter: number;
  private gradeIdCounter: number;
  private subjectIdCounter: number;
  private teacherGradeIdCounter: number;
  private teacherSubjectIdCounter: number;
  private planningWeekIdCounter: number;
  private weeklyPlanIdCounter: number;
  private dailyPlanIdCounter: number;
  
  sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map();
    this.grades = new Map();
    this.subjects = new Map();
    this.teacherGrades = new Map();
    this.teacherSubjects = new Map();
    this.planningWeeks = new Map();
    this.weeklyPlans = new Map();
    this.dailyPlans = new Map();
    
    this.userIdCounter = 1;
    this.gradeIdCounter = 1;
    this.subjectIdCounter = 1;
    this.teacherGradeIdCounter = 1;
    this.teacherSubjectIdCounter = 1;
    this.planningWeekIdCounter = 1;
    this.weeklyPlanIdCounter = 1;
    this.dailyPlanIdCounter = 1;
    
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getTeachers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => !user.isAdmin);
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
    const planningWeek: PlanningWeek = { ...week, id };
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
    
    return Promise.all(plans.map(async plan => {
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
    const dailyPlan: DailyPlan = { ...plan, id };
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
}

export const storage = new MemStorage();
