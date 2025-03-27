# Weekly Planner System: User Guide

This comprehensive guide explains how to use the Weekly Planner System for schools, covering both administrator and teacher functionality.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Administrator Guide](#administrator-guide)
   - [Managing Users](#managing-users)
   - [Managing Grades](#managing-grades)
   - [Managing Subjects](#managing-subjects)
   - [Teacher Assignments](#teacher-assignments)
   - [Planning Weeks](#planning-weeks)
   - [Viewing Weekly Plans](#viewing-weekly-plans-admin)
3. [Teacher Guide](#teacher-guide)
   - [Navigating Your Dashboard](#navigating-your-dashboard)
   - [Creating Weekly Plans](#creating-weekly-plans)
   - [Editing Daily Plans](#editing-daily-plans)
   - [Viewing Past Plans](#viewing-past-plans)
4. [Common Tasks](#common-tasks)
   - [User Profile Management](#user-profile-management)
   - [Password Reset](#password-reset)
5. [Troubleshooting](#troubleshooting)

## Getting Started

### Logging In

1. Navigate to the Weekly Planner System URL provided by your school administrator
2. Enter your username and password
3. Click "Log In"

Upon first login, you'll be directed to a dashboard tailored to your role (administrator or teacher).

## Administrator Guide

As an administrator, you have full control over the system, including managing users, grades, subjects, and viewing all weekly plans.

### Managing Users

#### Viewing All Users

1. From the admin dashboard, click "Teachers" in the sidebar
2. This displays a list of all teachers in the system

#### Adding a New User

1. On the Teachers page, click "Add Teacher"
2. Fill in the required information:
   - Full Name
   - Username
   - Password
   - Admin status (check if the user should have administrator privileges)
3. Click "Add Teacher" to create the account

#### Importing Multiple Users

1. On the Teachers page, click "Import Users"
2. Prepare a CSV file with the following columns:
   - username (required)
   - password (required)
   - fullName
   - email
   - role (use "admin" for admin users)
3. Upload the CSV file using the file picker
4. Click "Import Users" to process the file
5. A confirmation message will show how many users were successfully imported

#### Changing User Roles

1. On the Teachers page, find the user you want to modify
2. Click the shield icon to toggle between admin and teacher roles
   - Shield check icon: Makes the user an administrator
   - Shield off icon: Removes administrator privileges
3. Confirm the change when prompted

#### Deleting a User

1. On the Teachers page, find the user you want to delete
2. Click the trash icon
3. Confirm the deletion in the dialog that appears
4. Note: You cannot delete your own account

### Managing Grades

#### Viewing All Grades

1. From the admin dashboard, click "Grades" in the sidebar
2. This displays a list of all grades in the system

#### Adding a New Grade

1. On the Grades page, click "Add Grade"
2. Enter the grade name (e.g., "Grade 1", "Grade 2", etc.)
3. Click "Add" to create the grade

#### Editing a Grade

1. On the Grades page, find the grade you want to modify
2. Click the edit (pencil) icon
3. Update the grade name
4. Click "Save Changes"

#### Deleting a Grade

1. On the Grades page, find the grade you want to delete
2. Click the delete (trash) icon
3. Confirm the deletion
4. Note: You cannot delete grades that have associated weekly plans

### Managing Subjects

#### Viewing All Subjects

1. From the admin dashboard, click "Subjects" in the sidebar
2. This displays a list of all subjects in the system

#### Adding a New Subject

1. On the Subjects page, click "Add Subject"
2. Enter the subject name (e.g., "Mathematics", "Science", etc.)
3. Click "Add" to create the subject

#### Editing a Subject

1. On the Subjects page, find the subject you want to modify
2. Click the edit (pencil) icon
3. Update the subject name
4. Click "Save Changes"

#### Deleting a Subject

1. On the Subjects page, find the subject you want to delete
2. Click the delete (trash) icon
3. Confirm the deletion
4. Note: You cannot delete subjects that have associated weekly plans

### Teacher Assignments

#### Assigning a Teacher to a Grade

1. On the Teachers page, find the teacher you want to assign
2. Click the "+ Grade" button
3. Select the grade from the dropdown menu
4. Click "Assign"
5. The grade will now appear in the teacher's assigned grades list

#### Assigning a Teacher to a Subject

1. On the Teachers page, find the teacher you want to assign
2. Click the "+ Subject" button
3. Select a grade first (the teacher must be assigned to this grade)
4. Select the subject from the dropdown menu
5. Click "Assign"
6. The teacher can now create weekly plans for this subject in the selected grade

#### Removing Assignments

1. Go to the Teachers page
2. Click "View Assignments" for the relevant teacher
3. In the expanded view, find the assignment you want to remove
4. Click the remove (x) button next to the grade or subject
5. Confirm the removal when prompted

### Planning Weeks

#### Viewing Planning Weeks

1. From the admin dashboard, click "Weekly Plans" in the sidebar
2. This displays a list of all planning weeks in the system

#### Creating a New Planning Week

1. On the Weekly Plans page, click "Add Planning Week"
2. Set the week number (1-52) and year
3. Enter the start date (Monday of the week)
4. Set the active status (determines if teachers can edit plans for this week)
5. Click "Add" to create the planning week

#### Activating/Deactivating a Planning Week

1. On the Weekly Plans page, find the week you want to modify
2. Toggle the "Active" switch
3. A confirmation message will appear
4. When a week is inactive, teachers cannot create or edit plans for that week

#### Deleting a Planning Week

1. On the Weekly Plans page, find the week you want to delete
2. Click the delete (trash) icon
3. Confirm the deletion
4. Note: You cannot delete weeks that have associated weekly plans

### Viewing Weekly Plans (Admin)

#### Viewing All Plans for a Grade and Week

1. From the admin dashboard, click "Weekly Plans" in the sidebar
2. Use the filters to select:
   - Planning Week
   - Grade
3. Click "View Plans"
4. This displays all submitted plans for the selected grade and week
5. Each plan shows the teacher, subject, and plan details

#### Viewing Detailed Plans

1. After filtering plans as described above
2. Click "View Details" on any plan
3. This shows the complete daily breakdown of the plan

## Teacher Guide

As a teacher, you can view and manage weekly plans for your assigned grades and subjects.

### Navigating Your Dashboard

When you log in as a teacher, your dashboard displays:

1. A list of grades assigned to you
2. A summary of recent planning activity
3. Quick access to create new weekly plans

### Creating Weekly Plans

#### Starting a New Weekly Plan

1. From your dashboard, click "My Weekly Plans" in the sidebar
2. Click "Create New Plan"
3. Select:
   - Grade (from your assigned grades)
   - Subject (from subjects assigned to you in that grade)
   - Planning Week (only active weeks are available)
4. Click "Create Plan"
5. You'll be directed to the plan editor

#### Plan Editor Overview

The plan editor shows:
1. The selected grade, subject, and week at the top
2. A tab for each day of the week (Monday through Friday)
3. Fields for entering plan details for each day

### Editing Daily Plans

For each day of the week, you need to fill in:

1. **Topic** (required) - The main lesson content for the day
2. Optional fields:
   - **Books & Pages** - Textbook references
   - **Homework** - Tasks for students to complete
   - **Homework Due Date** - When the homework should be submitted
   - **Assignments** - Additional tasks or projects
   - **Notes** - Extra comments or instructions

#### Saving Your Plans

1. After filling in the details for a day, click "Save"
2. You can edit any day's plan as long as the planning week is active
3. Your plans are automatically saved as drafts while editing

### Viewing Past Plans

1. From your dashboard, click "My Weekly Plans" in the sidebar
2. Use the filters to select:
   - Grade
   - Subject
   - Week (past weeks are available for viewing)
3. Click "View Plan" to see a read-only version of a past plan

## Common Tasks

### User Profile Management

#### Updating Your Profile

1. Click your username in the top-right corner
2. Select "Profile" from the dropdown menu
3. Update your information:
   - Full Name
   - Email
4. Click "Save Changes"

#### Changing Your Password

1. Navigate to your profile as described above
2. Go to the "Change Password" section
3. Enter your current password
4. Enter and confirm your new password
5. Click "Update Password"

### Password Reset

If you forget your password:

1. Contact your system administrator
2. They can reset your password through the admin interface
3. You'll receive a temporary password
4. Log in with the temporary password and then change it immediately

## Troubleshooting

### Common Issues

#### Cannot Access a Grade or Subject

If you cannot see an expected grade or subject:
1. Verify with your administrator that you've been assigned to it
2. Try refreshing the page
3. Check if you're logged in with the correct account

#### Cannot Edit a Weekly Plan

If you cannot edit a weekly plan:
1. Check if the planning week is active (only active weeks can be edited)
2. Verify that you're assigned to the grade and subject
3. Ensure you haven't exceeded any system limits

#### Page Not Loading

If a page fails to load:
1. Refresh the browser
2. Clear your browser cache
3. Try logging out and back in
4. If the problem persists, contact your administrator

### Getting Help

For additional help:
1. Contact your school's system administrator
2. Refer to this user guide
3. Check for any in-app help resources