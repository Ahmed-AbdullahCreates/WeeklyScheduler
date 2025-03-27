# Changelog

All notable changes to the Weekly Planner System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-03-27

### Added
- Initial release of the Weekly Planner System
- Role-based access control with administrator and teacher roles
- User management with profile editing
- CSV user import functionality for batch adding users
- Grade and subject management
- Teacher assignment to grades and subjects
- Planning week management with active/inactive status
- Weekly planning for each subject and grade
- Daily plan management for each day of the week (Monday through Friday)
- Admin dashboard with comprehensive management tools
- Teacher dashboard with grade-specific views
- Weekly plan editor with full functionality
- User profile management
- Comprehensive documentation including README, deployment guide, and user guide
- Database schema with proper relationships between entities
- Session-based authentication with password hashing

### Technical Features
- React with TypeScript frontend
- Express.js backend
- PostgreSQL database with Drizzle ORM
- TanStack Query (React Query) for state management
- React Hook Form with Zod validation
- Tailwind CSS with Shadcn components
- Responsive design for desktop and mobile use
- Form data handling for file uploads
- Session store for authentication persistence
- Password encryption with secure hashing

## [1.1.0] - Future Release

### Planned Features
- Export weekly plans to PDF
- Email notifications for plan submissions
- Calendar view for planning
- Rich text editor for plan content
- Image uploads for plan attachments
- Commenting system for plan reviews
- Statistical dashboard for planning activity
- Template system for reusing plans
- Multi-language support
- Dark mode theme option