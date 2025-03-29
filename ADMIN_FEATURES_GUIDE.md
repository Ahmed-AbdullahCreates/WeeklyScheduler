# Weekly Planner System - Admin Features Guide

This guide provides a comprehensive overview of the administrative features in the Weekly Planner System, including step-by-step instructions for all major functions. Use this document both as a demonstration script and as an ongoing reference for administrators.

## Table of Contents

1. [Teacher Management](#teacher-management)
2. [Grade Management](#grade-management)
3. [Subject Management](#subject-management)
4. [Common Admin Tasks](#common-admin-tasks)

---

## Teacher Management

**URL: `/admin/teachers`**

The Teachers page allows administrators to manage all teacher accounts in the system, including creating new accounts, assigning teachers to grades and subjects, and managing permissions.

### Key Features

#### Adding Teachers
1. Click the **"Add Teacher"** button
2. Fill in the required information:
   - Full Name
   - Username
   - Password
   - Admin privileges (checkbox)
3. Click **"Add Teacher"** to create the account

#### Bulk Importing Teachers
1. Click the **"Import Users"** button
2. Prepare a CSV file with the following columns:
   - username (required)
   - password (required)
   - fullName
   - isAdmin (true/false)
3. Upload your CSV file
4. Click **"Import"** to process the file

#### Assigning Grades to Teachers
1. Find the teacher you want to assign grades to
2. Click the **"+ Grade"** button in the Actions column
3. In the dialog that appears, check the grades you want to assign
4. Uncheck any grades you want to remove from this teacher
5. Click **"Done"** to save your changes

#### Assigning Subjects to Teachers
1. Find the teacher you want to assign subjects to
2. Click the **"+ Subject"** button in the Actions column
3. Select a grade from the dropdown (the teacher must already be assigned to this grade)
4. Select a subject from the dropdown
5. Click **"Assign Subject"** to complete the assignment

#### Viewing Teacher Assignments
1. In the "Assigned Grades" column, you can see badges showing which grades a teacher is assigned to
2. Click **"View Assignments"** for a detailed view of all assignments

#### Deleting a Teacher Account
1. Find the teacher you want to delete
2. Click the trash icon button
3. Confirm the deletion in the dialog that appears
4. Note: You cannot delete your own account

### Demo Script

1. "Let me show you how easy it is to add a new teacher to the system..."
   - Demonstrate adding a teacher named "Jane Smith"
   
2. "If you need to add multiple teachers at once, you can use our bulk import feature..."
   - Show the CSV import dialog
   
3. "Once teachers are added, you can assign them to specific grades..."
   - Assign Jane Smith to 2-3 grades
   
4. "And then assign them to teach specific subjects within those grades..."
   - Assign Jane Smith to Mathematics in one grade

---

## Grade Management

**URL: `/admin/grades`**

The Grades page allows administrators to create and manage all grade levels in the school. Each grade can have multiple subjects and teachers assigned to it.

### Key Features

#### Adding a New Grade
1. Click the **"Add Grade"** button
2. Enter the grade name (e.g., "Grade 1", "First Grade", "Year 3")
3. Click **"Add Grade"** to create it

#### Editing a Grade
1. Find the grade you want to modify
2. Click the **"Edit"** button (pencil icon)
3. Update the grade name
4. Click **"Update Grade"** to save changes

#### Deleting a Grade
1. Find the grade you want to delete
2. Click the **"Delete"** button (trash icon)
3. Confirm the deletion
4. Note: You cannot delete grades that have weekly plans associated with them

### Demo Script

1. "Let me show you how to add a new grade to the system..."
   - Demonstrate adding "Grade 5"
   
2. "If you need to rename a grade, it's very simple..."
   - Edit "Grade 5" to "Fifth Grade"
   
3. "When a grade is no longer needed, you can easily remove it..."
   - Show the delete confirmation dialog

---

## Subject Management

**URL: `/admin/subjects`**

The Subjects page allows administrators to create and manage all academic subjects taught in the school. These subjects can then be assigned to teachers for specific grades.

### Key Features

#### Adding a New Subject
1. Click the **"Add Subject"** button
2. Enter the subject name (e.g., "Mathematics", "English Literature")
3. Click **"Add Subject"** to create it

#### Editing a Subject
1. Find the subject you want to modify
2. Click the **"Edit"** button (pencil icon)
3. Update the subject name
4. Click **"Update Subject"** to save changes

#### Deleting a Subject
1. Find the subject you want to delete
2. Click the **"Delete"** button (trash icon)
3. Confirm the deletion
4. Note: Deleting a subject will remove all teacher assignments for this subject

### Demo Script

1. "Let me show you how to add a new subject to the curriculum..."
   - Demonstrate adding "Computer Science"
   
2. "If you need to update a subject name, it's very straightforward..."
   - Edit "Computer Science" to "Computer Programming"
   
3. "When a subject is no longer taught, you can remove it from the system..."
   - Show the delete confirmation dialog

---

## Common Admin Tasks

### Setting Up a New Teacher

1. Add the teacher account (Teachers page)
2. Assign appropriate grades to the teacher (Teachers page)
3. Assign subjects within those grades (Teachers page)
4. The teacher can now create weekly plans for their assigned subjects

### Adding a New Class/Grade

1. Create the grade (Grades page)
2. Create any required subjects if they don't exist (Subjects page)
3. Assign teachers to the new grade (Teachers page)
4. Assign subjects to those teachers for the new grade (Teachers page)

### Preparing for a New School Year

1. Review and update grade levels (Grades page)
2. Review and update subjects (Subjects page)
3. Update teacher assignments as needed (Teachers page)
4. Create new planning weeks for the upcoming terms (Weekly Plans page)

---

## Tips for Effective Demonstrations

1. **Focus on Simplicity**: Emphasize how intuitive the interface is
2. **Show Real-World Examples**: Use realistic school grade names and subjects
3. **Highlight Integration**: Show how changes in one area (e.g., adding a grade) affect other areas
4. **Showcase Efficiency**: Demonstrate bulk imports for adding multiple teachers quickly
5. **Address Common Concerns**: Show how easy it is to correct mistakes (editing, deleting)

---

## Best Practices for Administrators

1. **Regular Maintenance**: Review and update teacher assignments at the beginning of each term
2. **Consistent Naming**: Use consistent naming conventions for grades and subjects
3. **User Training**: Ensure all administrators and teachers are trained on their respective interfaces
4. **Data Backups**: Regularly export important data for backup purposes
5. **Permission Management**: Be cautious when granting administrative privileges

For additional support or questions, please refer to the full USER_GUIDE.md or contact system support.
