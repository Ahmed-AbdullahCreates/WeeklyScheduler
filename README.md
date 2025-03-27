# Weekly Planner System for Schools

A comprehensive web application designed to streamline lesson planning, teacher administration, and academic tracking for schools.

## System Overview

The Weekly Planner System is a web application designed for schools, enabling teachers to manage their weekly lesson plans efficiently while giving administrators full control over grades, subjects, and weekly planning. The system uses a role-based approach with different interfaces for administrators and teachers.

## Features

### User Management
- **Role-based Access Control**: Different interfaces for administrators and teachers
- **User Profile Management**: Update personal information and credentials
- **Bulk User Import**: Add multiple users via CSV file upload

### Administration Features
- **Grade Management**: Create, edit, and delete grades
- **Subject Management**: Create, edit, and delete subjects across grades
- **Teacher Assignment**: Assign teachers to specific grades and subjects
- **Planning Week Control**: Activate or deactivate weeks for planning
- **User Administration**: Manage user roles and delete accounts

### Teacher Features
- **Grade-Specific View**: See only assigned grades and subjects
- **Weekly Planning**: Create and manage lesson plans for each day of the week
- **Planning History**: View historical lesson plans
- **Subject-Specific Planning**: Manage different plans for different subjects

### Weekly Plan Structure
Each teacher fills out a weekly plan for each subject in their assigned grades. The plan includes:

**Required Fields:**
- Topic (The main lesson content)

**Optional Fields:**
- Books & Pages (References from textbooks)
- Homework (Tasks for students)
- Homework Due Date (Submission deadline)
- Assignments (Additional tasks or projects)
- Notes (Extra comments or instructions)

## Technology Stack

- **Frontend**: React with TypeScript
- **UI Framework**: Tailwind CSS with Shadcn components
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Backend**: Express.js (Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your environment variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/weekly_planner
   SESSION_SECRET=your_session_secret
   ```
4. Run database migrations:
   ```
   npm run db:push
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Deployment

This application can be deployed to any platform that supports Node.js applications and PostgreSQL databases. On Replit, you can deploy the application by clicking the "Deploy" button in the Replit interface.

## Database Schema

The system uses the following main entities:

- **Users**: Administrators and teachers with role-based access
- **Grades**: School grades (e.g., Grade 1, Grade 2)
- **Subjects**: Academic subjects (e.g., Math, Science)
- **TeacherGrades**: Assignments of teachers to grades
- **TeacherSubjects**: Assignments of teachers to subjects within grades
- **PlanningWeeks**: Weekly planning periods with active/inactive status
- **WeeklyPlans**: Plan headers for a teacher, grade, subject, and week
- **DailyPlans**: Daily planning details for each day of the week

## Usage

### Admin Workflow

1. Log in as an administrator
2. Set up grades and subjects in the system
3. Add teachers and assign them to specific grades and subjects
4. Activate weekly planning periods
5. View and monitor teacher submissions

### Teacher Workflow

1. Log in as a teacher
2. View assigned grades and subjects
3. Select a grade and subject to plan for
4. Fill in the weekly plan for each day
5. Save and submit the plan

## CSV Import Format

The system supports importing multiple users via CSV. The CSV format should include the following columns:

- `username` (required)
- `password` (required)
- `fullName`
- `email`
- `role` (use "admin" for admin users)

Example CSV row:
```
johndoe,password123,John Doe,john@example.com,teacher
```

## Contributing

Guidelines for contributing to the project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.