# Weekly Planner System Documentation

## System Overview

The Weekly Planner System is a comprehensive web application designed for schools to manage teachers, grades, subjects, and lesson planning. It provides role-based access with distinct interfaces for:

- **Administrators**: Manage users, grades, subjects, and oversee all weekly plans
- **Teachers**: Create and manage weekly plans for their assigned grades and subjects

## Key Features

- User management with role-based access control
- Grade and subject management
- Teacher-grade-subject assignments
- Weekly planning with daily lesson details
- Export functionality (PDF and Excel formats)
- Calendar view for visualizing planning weeks
- CSV import for bulk user creation

## Technical Stack

- **Frontend**: React with TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based authentication
- **Data Validation**: Zod schemas
- **Export Functionality**: PDFKit and ExcelJS

## Role-Based Access

### Administrator Capabilities
- Add/edit/delete users, including setting user roles
- Manage grades and subjects
- Assign teachers to grades and subjects
- View all weekly plans across the system
- Import users via CSV
- Access administration dashboard with system statistics
- Export weekly plans to PDF and Excel formats

### Teacher Capabilities
- View assigned grades and subjects
- Create and manage weekly plans for their assigned classes
- Add detailed daily plans for each weekday
- Export their weekly plans to PDF and Excel formats
- View a calendar of their planning weeks

## Data Model Overview

### Core Entities
- **Users**: System users (teachers and administrators)
- **Grades**: School grades (e.g., Grade 1, Grade 2)
- **Subjects**: Academic subjects (e.g., Mathematics, Science)
- **TeacherGrades**: Assignments of teachers to grades
- **TeacherSubjects**: Assignments of teachers to subjects within grades
- **PlanningWeeks**: Calendar weeks for planning
- **WeeklyPlans**: Plans created by teachers for a specific grade, subject, and week
- **DailyPlans**: Daily details within a weekly plan (for each weekday)

## Export Functionality

The system provides two export formats for weekly plans:

### PDF Export
- Generates a professional PDF document with the weekly plan
- Includes teacher, grade, subject, and week information
- Displays daily plans in a structured format
- Features well-designed headers, footers, and styling
- Accessible from the weekly plans interface

### Excel Export
- Creates a formatted Excel spreadsheet with the weekly plan details
- Includes a cover sheet with plan metadata
- Provides daily plans in separate, well-structured worksheets
- Uses proper formatting, cell styling, and organization
- Accessible from the weekly plans interface

## User Authentication

- Username/password authentication
- Secure password hashing using Node.js crypto module
- Session-based persistence using Express sessions
- Role-based route protection

## Getting Started

### Default Admin Account
- Username: admin
- Password: password

### First-time Setup
1. Log in using the default admin account
2. Set up grades and subjects
3. Create teacher accounts
4. Assign teachers to grades and subjects
5. Create planning weeks
6. Begin creating weekly plans

## API Endpoints

### Authentication
- `POST /api/login`: User login
- `POST /api/register`: User registration
- `POST /api/logout`: User logout
- `GET /api/user`: Get current user information

### User Management
- `GET /api/users`: Get all users
- `GET /api/teachers`: Get all teachers
- `POST /api/users`: Create a new user
- `PUT /api/users/:id`: Update a user
- `DELETE /api/users/:id`: Delete a user
- `POST /api/users/import`: Import users via CSV

### Grade Management
- `GET /api/grades`: Get all grades
- `POST /api/grades`: Create a new grade
- `PUT /api/grades/:id`: Update a grade
- `DELETE /api/grades/:id`: Delete a grade

### Subject Management
- `GET /api/subjects`: Get all subjects
- `POST /api/subjects`: Create a new subject
- `PUT /api/subjects/:id`: Update a subject
- `DELETE /api/subjects/:id`: Delete a subject

### Teacher Assignments
- `POST /api/teacher-grades`: Assign a teacher to a grade
- `DELETE /api/teacher-grades/:teacherId/:gradeId`: Remove a teacher from a grade
- `GET /api/teachers/:id/grades`: Get a teacher's assigned grades
- `GET /api/grades/:id/teachers`: Get teachers assigned to a grade
- `POST /api/teacher-subjects`: Assign a teacher to a subject
- `DELETE /api/teacher-subjects/:teacherId/:gradeId/:subjectId`: Remove a teacher from a subject
- `GET /api/teachers/:id/grades/:gradeId/subjects`: Get a teacher's subjects for a grade

### Planning Weeks
- `GET /api/planning-weeks`: Get all planning weeks
- `GET /api/planning-weeks/active`: Get active planning weeks
- `POST /api/planning-weeks`: Create a new planning week
- `PUT /api/planning-weeks/:id/toggle`: Toggle a planning week's active status
- `DELETE /api/planning-weeks/:id`: Delete a planning week

### Weekly Plans
- `GET /api/weekly-plans`: Get all weekly plans
- `GET /api/weekly-plans/:id`: Get a specific weekly plan
- `GET /api/weekly-plans/teacher/:id`: Get a teacher's weekly plans
- `GET /api/weekly-plans/grade/:id`: Get weekly plans for a grade
- `GET /api/weekly-plans/week/:id`: Get weekly plans for a planning week
- `GET /api/weekly-plans/grade/:gradeId/week/:weekId`: Get weekly plans for a grade and week
- `POST /api/weekly-plans`: Create a new weekly plan
- `GET /api/weekly-plans/:id/export-pdf`: Export a weekly plan as PDF
- `GET /api/weekly-plans/:id/export-excel`: Export a weekly plan as Excel

### Daily Plans
- `GET /api/daily-plans/:id`: Get a specific daily plan
- `GET /api/weekly-plans/:id/daily-plans`: Get daily plans for a weekly plan
- `POST /api/daily-plans`: Create a new daily plan
- `PUT /api/daily-plans/:id`: Update a daily plan

## Troubleshooting

### Common Issues

1. **PDF Export Not Working**
   - Ensure you have clicked on a valid weekly plan
   - Check that all required data (teacher, grade, subject, week) is available
   - Try refreshing the page before attempting the export again

2. **Excel Export Issues**
   - Excel exports require a complete weekly plan
   - Ensure your browser allows file downloads

3. **Login Problems**
   - Verify username and password
   - Check for caps lock or typing errors
   - If persistent, contact a system administrator

4. **Missing Assignments**
   - Teachers must be assigned to grades and subjects to create plans
   - Verify assignments in the admin interface

5. **Calendar View Not Showing Plans**
   - Ensure planning weeks have been created
   - Verify teacher assignments to grades and subjects

## Best Practices

1. **Planning Weeks**
   - Create planning weeks in advance
   - Use consistent week numbering
   - Include meaningful descriptions

2. **Weekly Plans**
   - Complete all five weekdays when possible
   - Add detailed notes for substitutes
   - Include book references and page numbers

3. **Daily Plans**
   - Use consistent formatting
   - Include clear homework instructions
   - Add due dates for assignments

4. **Exports**
   - Export to PDF for sharing with parents or printing
   - Use Excel export for analysis or modification

5. **User Management**
   - Update passwords regularly
   - Use properly formatted names
   - Verify teacher assignments