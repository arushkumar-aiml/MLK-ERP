# Phase 2 Models

All Phase 2 models use Mongoose schemas with validation, indexes, and `timestamps: true`.

## School

Represents one school tenant in the ERP. It stores the school name, unique code, optional contact details, address, current academic year, operational status, and basic settings such as timezone and currency.

Indexes:

- Unique `code` for tenant lookup.
- Sparse unique `email` so schools can optionally have a unique contact email.
- `status + name` for active/inactive school listings.

## User

Represents an authenticated account scoped to a school. It stores identity fields, contact details, a hidden `passwordHash`, role, account status, and the last login time. The schema supports admin, staff, parent, and student account roles.

Indexes:

- Unique `school + email` to prevent duplicate accounts inside the same school.
- `school + role + status` for user management screens and authorization queries.
- Sparse `school + phone` for optional phone lookup.

## Student

Represents a student admission profile. It stores admission number, personal details, class placement, admission date, guardian contact details, address, optional linked user account, and student lifecycle status.

Indexes:

- Unique `school + admissionNumber` to keep admission numbers unique per school.
- `school + className + section + rollNumber` for class rosters.
- Sparse unique `user` so one user account links to only one student profile.
- `school + status` for active, transferred, or graduated student filters.

## Teacher

Represents a teacher/staff profile. It stores employee ID, personal and contact details, joining date, subjects, optional class teacher assignment, employment type, optional linked user account, and employment status.

Indexes:

- Unique `school + employeeId` to keep staff identifiers unique per school.
- Sparse unique `school + email` for optional teacher email uniqueness.
- Sparse unique `user` so one user account links to only one teacher profile.
- `school + status` for staff filters.
- `school + classTeacherOf` for finding assigned class teachers.
