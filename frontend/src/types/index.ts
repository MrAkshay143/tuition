// All TypeScript types for EduFlow
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export type Role = 'admin' | 'teacher' | 'student'


export interface User {
  id: number
  name: string
  email: string
  role: Role
  permissions?: string[]
  avatar: string | null
  active: boolean
  phone: string | null
  google_id: string | null
  fcm_token: string | null
  theme?: 'light' | 'dark' | 'system'
  two_factor_enabled: boolean
  email_verified_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface Student extends User {
  role: 'student'
  batches?: Batch[]
  courses?: Course[]
  progress?: StudentProgress
  attendance_percentage?: number
}

export interface Batch {
  id: number
  name: string
  description: string | null
  color: string
  icon: string | null
  students_count: number
  courses_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  students?: Student[]
}

export interface Course {
  id: number
  title: string
  description: string | null
  banner: string | null
  thumbnail: string | null
  status: 'draft' | 'published'
  estimated_hours: number | null
  modules_count: number
  lessons_count: number
  enrolled_count: number
  created_at: string
  updated_at: string
  modules?: Module[]
  teacher?: User
}

export interface Module {
  id: number
  course_id: number
  title: string
  description: string | null
  order: number
  chapters?: Chapter[]
}

export interface Chapter {
  id: number
  module_id: number
  title: string
  order: number
  lessons?: Lesson[]
}

export interface Lesson {
  id: number
  chapter_id: number
  title: string
  type: 'video' | 'pdf' | 'ppt' | 'docx' | 'image' | 'audio' | 'link' | 'live_class' | 'assignment' | 'quiz' | string
  content_id: number | null
  order: number
  duration_minutes: number | null
  duration_seconds?: number | null
  is_free: boolean
  is_free_preview?: boolean
  content?: string | null
  primary_media_id?: number | null
}

export interface Video {
  id: number
  title: string
  description: string | null
  provider: 'youtube' | 'local' | 'r2' | 's3'
  provider_id: string | null
  hls_url: string | null
  signed_url: string | null
  thumbnail: string | null
  duration_seconds: number | null
  allow_download: boolean
  watermark: boolean
  expiry_date: string | null
  batch_restriction: number[] | null
  created_at: string
}

export interface Note {
  id: number
  title: string
  description: string | null
  file_url: string
  file_type: 'pdf' | 'ppt' | 'docx' | 'image'
  file_size: number
  allow_download: boolean
  batch_ids: number[] | null
  created_at: string
}

export interface LiveClass {
  id: number
  title: string
  description: string | null
  provider: 'zoom' | 'meet'
  meeting_url: string
  meeting_id: string | null
  password: string | null
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'live' | 'ended'
  recording_url: string | null
  batch_ids: number[]
  attendees_count?: number
  created_at: string
}

export interface Assignment {
  id: number
  title: string
  description: string
  instructions: string | null
  due_date: string
  total_marks: number
  allow_late: boolean
  batch_ids: number[]
  attachments: string[]
  submissions_count: number
  pending_review_count: number
  created_at: string
}

export interface AssignmentSubmission {
  id: number
  assignment_id: number
  student: Student
  files: string[]
  submitted_at: string
  status: 'submitted' | 'reviewed' | 'returned'
  grade: number | null
  feedback: string | null
  reviewed_at: string | null
}

export interface Exam {
  id: number
  title: string
  description: string | null
  type: 'mcq' | 'subjective' | 'mixed'
  duration_minutes: number
  total_marks: number
  passing_marks: number
  negative_marking: number
  randomize_questions: boolean
  randomize_options: boolean
  show_result_immediately: boolean
  scheduled_at: string | null
  expires_at: string | null
  batch_ids: number[]
  questions_count: number
  attempts_count: number
  created_at: string
}

export interface Certificate {
  id: number
  student: Student
  type: 'completion' | 'participation' | 'merit'
  course?: Course
  issued_at: string
  qr_code: string
  pdf_url: string
}

export interface Announcement {
  id: number
  title: string
  body: string
  type: 'homework' | 'holiday' | 'exam_reminder' | 'live_reminder' | 'new_course' | 'new_notes' | 'new_video' | 'general'
  channels: ('in_app' | 'email' | 'push')[]
  batch_ids: number[] | null
  is_all: boolean
  sent_at: string | null
  created_at: string
}

export interface Message {
  id: number
  sender_id: number
  receiver_id: number
  body: string | null
  attachments: string[]
  read_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  icon: string
  action_url: string | null
  read_at: string | null
  created_at: string
  data?: Record<string, unknown>
}

export interface ActivityLog {
  id: number
  user_id?: number
  user: User
  event: string
  description: string
  ip_address: string
  user_agent: string
  properties?: Record<string, any>
  created_at: string
}

export interface DeviceSession {
  id: number
  user_id: number
  device_name: string
  ip_address: string
  user_agent: string
  last_active_at: string
  is_current: boolean
  created_at: string
}

export interface Setting {
  key: string
  value: string
  group: string
}

export interface PlatformSettings {
  app_name: string
  app_logo: string | null
  app_url: string
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password?: string
  smtp_from: string
  fcm_server_key: string
  storage_provider: 'local' | 'r2' | 's3'
  r2_bucket: string
  r2_endpoint: string
  s3_bucket: string
  s3_region: string
  security_force_https?: boolean
  security_rate_limiting?: boolean
  security_activity_logging?: boolean
}

export interface SystemHealth {
  queue_depth: number
  queue_workers: number
  redis_connected: boolean
  storage_used_bytes: number
  storage_total_bytes: number
  db_size_bytes: number
  php_version: string
  laravel_version: string
  uptime_seconds: number
}

export interface StudentProgress {
  student_id: number
  courses_enrolled: number
  courses_completed: number
  lessons_completed: number
  total_lessons: number
  assignments_submitted: number
  assignments_pending: number
  exams_taken: number
  average_score: number
  attendance_percentage: number
  total_watch_hours: number
}

// Dashboard Bundle
export interface DashboardBundle {
  teacher: User
  stats: {
    total_students: number
    active_students: number
    total_batches: number
    total_courses: number
    pending_assignments: number
    todays_classes: number
  }
  todays_classes: LiveClass[]
  upcoming_classes: LiveClass[]
  recent_submissions: AssignmentSubmission[]
  recent_notifications: Notification[]
  unread_notifications: number
  storage: {
    used_bytes: number
    total_bytes: number
    percentage: number
  }
  weekly_activity: { date: string; students_active: number; lessons_completed: number }[]
}

export interface StudentDashboardBundle {
  student: Student
  notifications: Notification[]
  unread_notifications: number
  todays_classes: LiveClass[]
  upcoming_classes: LiveClass[]
  recent_lessons: Lesson[]
  pending_assignments: Assignment[]
  upcoming_exams: Exam[]
  progress: StudentProgress
}

export interface AdminOverviewBundle {
  stats: {
    total_users: number
    active_students: number
    teacher: User | null
    total_courses: number
    storage_used_bytes: number
  }
  system_health: SystemHealth
  recent_logs: ActivityLog[]
  active_sessions: number
}

// API Response wrappers
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    next_cursor: string | null
    prev_cursor: string | null
  }
  links: { first: string; last: string; next: string | null; prev: string | null }
}

export interface AuthResponse {
  token: string
  token_type: string
  user: User
}

// Form types
export interface LoginForm {
  email: string
  password: string
  remember?: boolean
}

export interface StudentForm {
  name: string
  email: string
  phone: string
  password?: string
  avatar?: File
  batch_ids?: number[]
  course_ids?: number[]
}

export interface BatchForm {
  name: string
  description?: string
  color: string
  is_active: boolean
}

export interface AnnouncementForm {
  title: string
  body: string
  type: Announcement['type']
  channels: Announcement['channels']
  batch_ids?: number[]
  is_all: boolean
  send_at?: string
}

export type NotificationType = 'all' | 'assignment' | 'exam' | 'live_class' | 'announcement' | 'certificate'
