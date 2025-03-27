import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { 
  users, grades, subjects, planningWeeks,
  teacherGrades, teacherSubjects
} from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    console.log("Initializing database with sample data...");
    
    // Check if admin user exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"));
    
    if (existingAdmin.length === 0) {
      // Create admin user
      console.log("Creating admin user...");
      await db.insert(users).values({
        username: "admin",
        password: await hashPassword("password"),
        fullName: "Admin User",
        isAdmin: true
      });
    }
    
    // Check if teacher exists
    const existingTeacher = await db
      .select()
      .from(users)
      .where(eq(users.username, "teacher"));
    
    if (existingTeacher.length === 0) {
      // Create teacher user
      console.log("Creating teacher user...");
      await db.insert(users).values({
        username: "teacher",
        password: await hashPassword("password"),
        fullName: "Teacher User",
        isAdmin: false
      });
    }
    
    // Check if grades exist
    const existingGrades = await db.select().from(grades);
    
    if (existingGrades.length === 0) {
      // Create sample grades
      console.log("Creating sample grades...");
      await db.insert(grades).values([
        { name: "Grade 1" },
        { name: "Grade 2" },
        { name: "Grade 3" },
        { name: "Grade 4" },
        { name: "Grade 5" }
      ]);
    }
    
    // Check if subjects exist
    const existingSubjects = await db.select().from(subjects);
    
    if (existingSubjects.length === 0) {
      // Create sample subjects
      console.log("Creating sample subjects...");
      await db.insert(subjects).values([
        { name: "Mathematics" },
        { name: "Science" },
        { name: "Language Arts" },
        { name: "Social Studies" },
        { name: "Physical Education" },
        { name: "Arts" }
      ]);
    }
    
    // Check if planning weeks exist
    const existingWeeks = await db.select().from(planningWeeks);
    
    if (existingWeeks.length === 0) {
      // Create sample planning weeks
      console.log("Creating sample planning weeks...");
      const now = new Date();
      const currentWeek = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);
      const currentYear = now.getFullYear();
      
      // Create weeks for current month
      await db.insert(planningWeeks).values([
        {
          weekNumber: currentWeek,
          year: currentYear,
          startDate: new Date().toISOString().split('T')[0],
          isActive: true
        },
        {
          weekNumber: currentWeek + 1,
          year: currentYear,
          startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: true
        },
        {
          weekNumber: currentWeek + 2,
          year: currentYear,
          startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: true
        }
      ]);
    }
    
    // Assign teacher to grades and subjects if needed
    const teacherData = await db.select().from(users).where(eq(users.username, "teacher"));
    
    if (teacherData.length > 0) {
      const teacher = teacherData[0];
      
      // Check if teacher has assigned grades
      const teacherGradeAssignments = await db
        .select()
        .from(teacherGrades)
        .where(eq(teacherGrades.teacherId, teacher.id));
      
      if (teacherGradeAssignments.length === 0) {
        // Assign teacher to grade 1 and 2
        console.log("Assigning teacher to grades...");
        const gradeData = await db.select().from(grades).limit(2);
        
        for (const grade of gradeData) {
          await db.insert(teacherGrades).values({
            teacherId: teacher.id,
            gradeId: grade.id
          });
        }
        
        // Assign teacher to some subjects in those grades
        console.log("Assigning teacher to subjects...");
        const subjectData = await db.select().from(subjects).limit(3);
        
        for (const grade of gradeData) {
          for (const subject of subjectData) {
            await db.insert(teacherSubjects).values({
              teacherId: teacher.id,
              gradeId: grade.id,
              subjectId: subject.id
            });
          }
        }
      }
    }
    
    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });