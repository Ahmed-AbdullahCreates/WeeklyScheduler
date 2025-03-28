import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import multer from "multer";
import { parseUsersCsv, processUserImport } from "./utils/csv-import";
import { generateSimplePDF } from "./utils/simple-pdf-generator";
import { generateExcelWorkbook } from "./utils/excel-export";
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

// Import your preferred generator
import { generateWeeklyPlanPDF } from './utils/enhanced-pdf-generator';
// For a new generator, add:
// import { generateModernPDF } from './utils/modern-pdf-generator';

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
  
  // User management
  app.get("/api/users", isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });
  
  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    
    // Prevent deleting yourself
    if (userId === (req.user as User).id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    const success = await storage.deleteUser(userId);
    if (success) {
      res.status(200).json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found or could not be deleted" });
    }
  });
  
  app.patch("/api/users/:id/role", isAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    
    // Validate request body
    const schema = z.object({
      isAdmin: z.boolean()
    });
    
    try {
      const { isAdmin: newRole } = schema.parse(req.body);
      
      // Prevent removing your own admin access
      if (userId === (req.user as User).id && !newRole) {
        return res.status(400).json({ message: "Cannot remove your own admin privileges" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, newRole);
      if (updatedUser) {
        res.json(updatedUser);
      } else {
        res.status(404).json({ message: "User not found or role could not be updated" });
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid request data", error });
    }
  });
  
  // CSV User Import
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB file size limit
  });
  
  app.post("/api/users/import", isAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Accept both text/csv and application/octet-stream (common when downloading from various sources)
      const validMimeTypes = ['text/csv', 'application/octet-stream', 'application/vnd.ms-excel', 'text/plain'];
      if (!validMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          message: "Invalid file type. Please upload a CSV file.",
          allowedTypes: "CSV files only" 
        });
      }
      
      // Check file extension as a secondary validation
      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'csv') {
        return res.status(400).json({ 
          message: "Invalid file extension. Please upload a file with .csv extension.",
          allowedExtensions: ".csv" 
        });
      }
      
      // Parse and process the CSV file with improved validation
      const { users: usersData, errors, warnings } = await parseUsersCsv(req.file.buffer);
      
      // Handle validation errors
      if (errors.length > 0 && usersData.length === 0) {
        return res.status(400).json({ 
          message: "CSV validation failed with errors", 
          errors,
          warnings
        });
      }
      
      if (usersData.length === 0) {
        return res.status(400).json({ 
          message: "No valid user records found in CSV", 
          warnings,
          errors
        });
      }
      
      // Hash passwords and create users
      const processedUsers = await processUserImport(usersData);
      const createdUsers = [];
      const skippedUsers = [];
      const failedUsers = [];
      
      for (const userData of processedUsers) {
        try {
          // Check for duplicate usernames
          const existingUser = await storage.getUserByUsername(userData.username);
          if (existingUser) {
            skippedUsers.push({
              username: userData.username,
              reason: "Username already exists"
            });
            continue; // Skip this user
          }
          
          const user = await storage.createUser(userData);
          createdUsers.push(user);
        } catch (err) {
          console.error(`Error creating user ${userData.username}:`, err);
          failedUsers.push({
            username: userData.username,
            reason: (err as Error).message || "Unknown error"
          });
          // Continue with the next user
        }
      }
      
      // Determine appropriate status code
      const statusCode = errors.length > 0 || skippedUsers.length > 0 || failedUsers.length > 0 
        ? 207  // Multi-Status for partial success
        : 201; // Created for complete success
      
      res.status(statusCode).json({ 
        message: `Import completed: ${createdUsers.length} users created, ${skippedUsers.length} skipped, ${failedUsers.length} failed`,
        totalProcessed: processedUsers.length,
        usersCreated: createdUsers.length,
        skippedUsers: skippedUsers.length > 0 ? skippedUsers : undefined,
        failedUsers: failedUsers.length > 0 ? failedUsers : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error importing users:", error);
      res.status(500).json({ 
        message: "Error importing users", 
        error: (error as Error).message 
      });
    }
  });
  
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
  
  app.delete("/api/planning-weeks/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    
    // Check if there are any weekly plans for this week
    const weeklyPlans = await storage.getWeeklyPlansByWeek(id);
    if (weeklyPlans.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete this week because it has associated weekly plans. Please delete the weekly plans first." 
      });
    }
    
    const deleted = await storage.deletePlanningWeek(id);
    if (!deleted) {
      return res.status(404).json({ message: "Planning week not found" });
    }
    
    res.status(204).end();
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
  
  // Recent teacher assignments
  app.get("/api/recent-assignments", isAdmin, async (req, res) => {
    try {
      // Get 5 most recent teacher-grade assignments
      const recentAssignments = await storage.getRecentTeacherAssignments();
      res.json(recentAssignments);
    } catch (error) {
      res.status(500).json({ message: "Error retrieving recent assignments", error });
    }
  });
  
  // Update user profile
  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Users can only update their own profile unless they are admins
      if (req.user && (id !== req.user.id && !req.user.isAdmin)) {
        return res.status(403).json({ message: "Unauthorized to update this user's profile" });
      }
      
      // Only allowed to update certain fields
      const allowedUpdates = ["fullName", "password"];
      const updates: any = {};
      
      // Extract valid updates
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      
      // Hash password if it's being updated
      if (updates.password) {
        // Password will be hashed in the auth module
        // This is just placeholder logic
        // In a real app, we would use the hashPassword function from auth.ts
      }
      
      // Update user
      const updatedUser = await storage.updateUser(id, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user profile", error });
    }
  });
  
  // Export weekly plan to PDF
  app.get("/api/weekly-plans/:id/export-pdf", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the complete weekly plan data
      const planComplete = await storage.getWeeklyPlanComplete(id);
      if (!planComplete) {
        return res.status(404).json({ message: "Weekly plan not found" });
      }
      
      // Get additional information needed for PDF
      const teacher = await storage.getTeacherById(planComplete.weeklyPlan.teacherId);
      const defaultWeek = await storage.getWeekById(planComplete.weeklyPlan.weekId);
      const defaultGrade = await storage.getGradeById(planComplete.weeklyPlan.gradeId);
      const defaultSubject = await storage.getSubjectById(planComplete.weeklyPlan.subjectId);
      
      // Generate the PDF using your chosen generator
      const pdfBuffer = await generateWeeklyPlanPDF(
        planComplete,
        teacher?.name || "Unknown Teacher",
        defaultGrade.name,
        defaultSubject.name,
        defaultWeek.weekNumber,
        defaultWeek.year,
        defaultWeek.startDate
      );
      
      // Send the PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=weekly-plan-${defaultGrade.name}-${defaultSubject.name}-week-${defaultWeek.weekNumber}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send the PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error exporting weekly plan:", error);
      res.status(500).json({ message: "Error exporting weekly plan", error: (error as Error).message });
    }
  });
  
  // Excel export endpoint
  app.get("/api/weekly-plans/:id/export-excel", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the complete weekly plan data
      const planComplete = await storage.getWeeklyPlanComplete(id);
      if (!planComplete) {
        return res.status(404).json({ message: "Weekly plan not found" });
      }
      
      // Check permission
      const user = req.user as User;
      if (!user.isAdmin && planComplete.weeklyPlan.teacherId !== user.id) {
        return res.status(403).json({ message: "You don't have access to this plan" });
      }
      
      // Get additional data for the Excel
      const weekDetails = await storage.getPlanningWeekById(planComplete.weeklyPlan.weekId);
      const grade = await storage.getGradeById(planComplete.weeklyPlan.gradeId);
      const subject = await storage.getSubjectById(planComplete.weeklyPlan.subjectId);
      const teacher = await storage.getUser(planComplete.weeklyPlan.teacherId);
      
      // Use fallback values for any missing data instead of returning an error
      const defaultTeacher = teacher || { 
        id: planComplete.weeklyPlan.teacherId, 
        username: 'Unknown', 
        fullName: 'Unknown Teacher', 
        isAdmin: false, 
        password: '' 
      };
      
      const defaultGrade = grade || { 
        id: planComplete.weeklyPlan.gradeId, 
        name: `Grade ID ${planComplete.weeklyPlan.gradeId}` 
      };
      
      const defaultSubject = subject || { 
        id: planComplete.weeklyPlan.subjectId, 
        name: `Subject ID ${planComplete.weeklyPlan.subjectId}` 
      };
      
      const defaultWeek = weekDetails || { 
        id: planComplete.weeklyPlan.weekId, 
        weekNumber: 0, 
        year: new Date().getFullYear(),
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        isActive: false
      };
      
      // Log a warning about missing data
      if (!weekDetails || !grade || !subject || !teacher) {
        console.warn(`Warning: Some related data missing for Excel export of weekly plan ID ${planComplete.weeklyPlan.id}`);
      }
      
      // Generate the Excel with default values if needed
      const excelBuffer = await generateExcelWorkbook(
        planComplete,
        defaultTeacher.fullName,
        defaultGrade.name,
        defaultSubject.name,
        defaultWeek.weekNumber,
        defaultWeek.year,
        defaultWeek.startDate
      );
      
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=weekly-plan-${defaultGrade.name}-${defaultSubject.name}-week-${defaultWeek.weekNumber}.xlsx`);
      res.setHeader('Content-Length', excelBuffer.length);
      
      // Send the Excel
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      res.status(500).json({ message: "Error exporting Excel", error: (error as Error).message });
    }
  });
  
  // Update weekly plan notes
  app.put("/api/weekly-plans/:id/notes", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      
      // Get the weekly plan to check if it exists and if user is authorized
      const weeklyPlan = await storage.getWeeklyPlanById(id);
      
      if (!weeklyPlan) {
        return res.status(404).json({ message: "Weekly plan not found" });
      }
      
      // Only allow the teacher who created the plan or an admin to update it
      if (weeklyPlan.teacherId !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this plan" });
      }
      
      // Update just the notes field
      const updatedPlan = await storage.updateWeeklyPlanNotes(id, notes);
      
      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ message: "Error updating weekly plan notes", error: (error as Error).message });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
