export const USER_TYPES = [
  { value: 'admin', label: 'Admin' },
  { value: 'student', label: 'Student' },
  { value: 'coordinator', label: 'GUDOOMIYE KUXIGEEN' },
  { value: 'gudoomiye', label: 'GUDOOMIYE' },
];

// Single source of truth for how each userType value is displayed, so a
// role's DB/JWT value (which stays stable, e.g. 'coordinator') can differ
// from its UI label (e.g. "GUDOOMIYE KUXIGEEN") without every consumer
// re-deriving that mapping itself.
export const USER_TYPE_LABELS = {
  admin: 'Admin',
  student: 'Student',
  coordinator: 'GUDOOMIYE KUXIGEEN',
  gudoomiye: 'GUDOOMIYE',
};

// Widened to allow hyphens: a student's username is always their Student
// ID (see UsersPage.jsx / server-side userController.js), and Student IDs
// may contain hyphens (e.g. "STU-A102").
export const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/;
export const STUDENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export const GENDERS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

export const SCHOOL_LEVELS = [
  { value: 'Primary School', label: 'Primary School' },
  { value: 'Middle School', label: 'Middle School' },
];
