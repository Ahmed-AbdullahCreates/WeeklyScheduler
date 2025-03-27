import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertGradeSchema,
  insertSubjectSchema,
  insertTeacherGradeSchema,
  insertTeacherSubjectSchema,
  insertPlanningWeekSchema,
  insertWeeklyPlanSchema,
  insertDailyPlanSchema,
  LoginData,
  User
} from "@shared/schema";

const isAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const user = req.user as User;
  if (!user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Admin routes
  
  // Grade management
  app.get("/api/grades", isAuthenticated, async (req, res) => {
    const grades = await storage.getAllGrades();
    res.json(grades);
  });
  
  app.post("/api/grades", isAdmin, async (req, res) => {
    try {
      const gradeData = insertGradeSchema.parse(req.body);
      const grade = await storage.createGrade(gradeData);
      res.status(201).json(grade);
    } catch (error) {
      res.status(400).json({ message: "Invalid grade data", error });
    }
  });
  
  app.put("/api/grades/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const gradeData = insertGradeSchema.parse(req.body);
      const grade = await storage.updateGrade(id, gradeData);
      
      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }
      
      res.json(grade);
    } catch (error) {
      res.status(400).json({ message: "Invalid grade data", error });
    }
  });
  
  app.delete("/api/grades/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteGrade(id);
    
    if (!success) {
      return res.status(404).json({ message: "Grade not found" });
    }
    
    res.status(204).end();
  });
  
  // Subject management
  app.get("/api/subjects", isAuthenticated, async (req, res) => {
    const subjects = await storage.getAllSubjects();
    res.json(subjects);
  });
  
  app.post("/api/subjects", isAdmin, async (req, res) => {
    try {
      const subjectData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(subjectData);
      res.status(201).json(subject);
    } catch (error) {
      res.status(400).json({ message: "Invalid subject data", error });
    }
  });
  
  app.put("/api/subjects/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subjectData = insertSubjectSchema.parse(req.body);
      const subject = await storage.updateSubject(id, subjectData);
      
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      res.json(subject);
    } catch (error) {
      res.status(400).json({ message: "Invalid subject data", error });
    }
  });
  
  app.delete("/api/subjects/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteSubject(id);
    
    if (!success) {
      return res.status(404).json({ message: "Subject not found" });
    }
    
    res.status(204).end();
  });
  
  // Teacher management
  app.get("/api/teachers", isAdmin, async (req, res) => {
    const teachers = await storage.getTeachers();
    res.json(teachers);
  });
  
  // Teacher-Grade assignments
  app.post("/api/teacher-grades", isAdmin, async (req, res) => {
    try {
      const assignmentData = insertTeacherGradeSchema.parse(req.body);
      const assignment = await storage.assignTeacherToGrade(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Invalid assignment data", error });
    }
  });
  
  app.delete("/api/teacher-grades/:teacherId/:gradeId", isAdmin, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const gradeId = parseInt(req.params.gradeId);
    const success = await storage.removeTeacherFromGrade(teacherId, gradeId);
    
    if (!success) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    res.status(204).end();
  });
  
  app.get("/api/teacher-grades/:teacherId", isAuthenticated, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const grades = await storage.getTeacherGrades(teacherId);
    res.json(grades);
  });
  
  app.get("/api/grade-teachers/:gradeId", isAdmin, async (req, res) => {
    const gradeId = parseInt(req.params.gradeId);
    const teachers = await storage.getTeachersForGrade(gradeId);
    res.json(teachers);
  });
  
  // Teacher-Subject assignments
  app.post("/api/teacher-subjects", isAdmin, async (req, res) => {
    try {
      const assignmentData = insertTeacherSubjectSchema.parse(req.body);
      const assignment = await storage.assignTeacherToSubject(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Invalid assignment data", error });
    }
  });
  
  app.delete("/api/teacher-subjects/:teacherId/:gradeId/:subjectId", isAdmin, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const gradeId = parseInt(req.params.gradeId);
    const subjectId = parseInt(req.params.subjectId);
    const success = await storage.removeTeacherFromSubject(teacherId, gradeId, subjectId);
    
    if (!success) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    res.status(204).end();
  });
  
  app.get("/api/teacher-subjects/:teacherId/:gradeId", isAuthenticated, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const gradeId = parseInt(req.params.gradeId);
    const subjects = await storage.getTeacherSubjects(teacherId, gradeId);
    res.json(subjects);
  });
  
  // Planning weeks
  app.get("/api/planning-weeks", isAuthenticated, async (req, res) => {
    const weeks = await storage.getAllPlanningWeeks();
    res.json(weeks);
  });
  
  app.get("/api/planning-weeks/active", isAuthenticated, async (req, res) => {
    const weeks = await storage.getActivePlanningWeeks();
    res.json(weeks);
  });
  
  app.post("/api/planning-weeks", isAdmin, async (req, res) => {
    try {
      const weekData = insertPlanningWeekSchema.parse(req.body);
      const week = await storage.createPlanningWeek(weekData);
      res.status(201).json(week);
    } catch (error) {
      res.status(400).json({ message: "Invalid week data", error });
    }
  });
  
  app.put("/api/planning-weeks/:id/toggle", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const week = await storage.togglePlanningWeekStatus(id);
    
    if (!week) {
      return res.status(404).json({ message: "Planning week not found" });
    }
    
    res.json(week);
  });
  
  // Weekly plans
  app.post("/api/weekly-plans", isAuthenticated, async (req, res) => {
    try {
      const planData = insertWeeklyPlanSchema.parse(req.body);
      
      // Check if user has permission to create this plan
      const user = req.user as User;
      
      if (!user.isAdmin && planData.teacherId !== user.id) {
        return res.status(403).json({ message: "You can only create plans for yourself" });
      }
      
      // Check if teacher is assigned to this grade and subject
      const teacherSubjects = await storage.getTeacherSubjects(planData.teacherId, planData.gradeId);
      const hasSubject = teacherSubjects.some(subject => subject.id === planData.subjectId);
      
      if (!hasSubject) {
        return res.status(403).json({ message: "Teacher is not assigned to this subject in this grade" });
      }
      
      // Check if week is active
      const week = await storage.getPlanningWeekById(planData.weekId);
      if (!week || !week.isActive) {
        return res.status(403).json({ message: "Planning week is not active" });
      }
      
      const plan = await storage.createWeeklyPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ message: "Invalid plan data", error });
    }
  });
  
  app.get("/api/weekly-plans/teacher/:teacherId", isAuthenticated, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    
    // Check permission
    const user = req.user as User;
    if (!user.isAdmin && user.id !== teacherId) {
      return res.status(403).json({ message: "You can only view your own plans" });
    }
    
    const plans = await storage.getWeeklyPlansByTeacher(teacherId);
    res.json(plans);
  });
  
  app.get("/api/weekly-plans/grade/:gradeId/week/:weekId", isAuthenticated, async (req, res) => {
    const gradeId = parseInt(req.params.gradeId);
    const weekId = parseInt(req.params.weekId);
    
    // If user is a teacher, verify they have access to this grade
    const user = req.user as User;
    if (!user.isAdmin) {
      const teacherGrades = await storage.getTeacherGrades(user.id);
      const hasGrade = teacherGrades.some(grade => grade.id === gradeId);
      
      if (!hasGrade) {
        return res.status(403).json({ message: "You don't have access to this grade" });
      }
    }
    
    const plans = await storage.getWeeklyPlansByGradeAndWeek(gradeId, weekId);
    res.json(plans);
  });
  
  app.get("/api/weekly-plans/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const plan = await storage.getWeeklyPlanById(id);
    
    if (!plan) {
      return res.status(404).json({ message: "Weekly plan not found" });
    }
    
    // Check permission
    const user = req.user as User;
    if (!user.isAdmin && plan.teacherId !== user.id) {
      return res.status(403).json({ message: "You don't have access to this plan" });
    }
    
    res.json(plan);
  });
  
  app.get("/api/weekly-plans/:id/complete", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const planComplete = await storage.getWeeklyPlanComplete(id);
    
    if (!planComplete) {
      return res.status(404).json({ message: "Weekly plan not found" });
    }
    
    // Check permission
    const user = req.user as User;
    if (!user.isAdmin && planComplete.weeklyPlan.teacherId !== user.id) {
      return res.status(403).json({ message: "You don't have access to this plan" });
    }
    
    res.json(planComplete);
  });
  
  // Daily plans
  app.post("/api/daily-plans", isAuthenticated, async (req, res) => {
    try {
      const planData = insertDailyPlanSchema.parse(req.body);
      
      // Get the weekly plan to check permissions
      const weeklyPlan = await storage.getWeeklyPlanById(planData.weeklyPlanId);
      if (!weeklyPlan) {
        return res.status(404).json({ message: "Weekly plan not found" });
      }
      
      // Check permission
      const user = req.user as User;
      if (!user.isAdmin && weeklyPlan.teacherId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this plan" });
      }
      
      // Check if week is active
      const week = await storage.getPlanningWeekById(weeklyPlan.weekId);
      if (!week || !week.isActive) {
        return res.status(403).json({ message: "Planning week is not active" });
      }
      
      const plan = await storage.createDailyPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ message: "Invalid plan data", error });
    }
  });
  
  app.put("/api/daily-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get existing plan to check permissions
      const existingPlan = await storage.getDailyPlanById(id);
      if (!existingPlan) {
        return res.status(404).json({ message: "Daily plan not found" });
      }
      
      // Get the weekly plan to check permissions
      const weeklyPlan = await storage.getWeeklyPlanById(existingPlan.weeklyPlanId);
      if (!weeklyPlan) {
        return res.status(404).json({ message: "Weekly plan not found" });
      }
      
      // Check permission
      const user = req.user as User;
      if (!user.isAdmin && weeklyPlan.teacherId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this plan" });
      }
      
      // Check if week is active
      const week = await storage.getPlanningWeekById(weeklyPlan.weekId);
      if (!week || !week.isActive) {
        return res.status(403).json({ message: "Planning week is not active" });
      }
      
      const updateData = req.body;
      const plan = await storage.updateDailyPlan(id, updateData);
      
      if (!plan) {
        return res.status(404).json({ message: "Daily plan not found" });
      }
      
      res.json(plan);
    } catch (error) {
      res.status(400).json({ message: "Invalid plan data", error });
    }
  });
  
  app.get("/api/daily-plans/weekly/:weeklyPlanId", isAuthenticated, async (req, res) => {
    const weeklyPlanId = parseInt(req.params.weeklyPlanId);
    
    // Get the weekly plan to check permissions
    const weeklyPlan = await storage.getWeeklyPlanById(weeklyPlanId);
    if (!weeklyPlan) {
      return res.status(404).json({ message: "Weekly plan not found" });
    }
    
    // Check permission
    const user = req.user as User;
    if (!user.isAdmin && weeklyPlan.teacherId !== user.id) {
      return res.status(403).json({ message: "You don't have access to this plan" });
    }
    
    const plans = await storage.getDailyPlansByWeeklyPlan(weeklyPlanId);
    res.json(plans);
  });
  
  // Teacher data with assignments
  app.get("/api/teachers/:id/full", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    
    // Check permission
    const user = req.user as User;
    if (!user.isAdmin && user.id !== id) {
      return res.status(403).json({ message: "You can only view your own data" });
    }
    
    const teacherData = await storage.getTeacherFullData(id);
    
    if (!teacherData) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    
    res.json(teacherData);
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
