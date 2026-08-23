import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
const db = new Database(dbPath)

// Activer les clés étrangères
db.pragma('foreign_keys = ON')

const schema = `
-- Users
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "schoolId" TEXT,
  "district" TEXT,
  "province" TEXT,
  "level" TEXT,
  "subjects" TEXT,
  "currentSchoolYearId" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SchoolProfile
CREATE TABLE IF NOT EXISTS "SchoolProfile" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "schoolName" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "subjects" TEXT NOT NULL,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- UserSettings
CREATE TABLE IF NOT EXISTS "UserSettings" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL,
  "theme" TEXT DEFAULT 'light',
  "primaryColor" TEXT DEFAULT '#6366f1',
  "dateFormat" TEXT DEFAULT 'dd/MM/yyyy',
  "timeFormat" TEXT DEFAULT '24h',
  "firstDayOfWeek" INTEGER DEFAULT 0,
  "showWeekends" INTEGER DEFAULT 1,
  "language" TEXT DEFAULT 'fr',
  "notificationsEnabled" INTEGER DEFAULT 1,
  "notesLocation" TEXT DEFAULT 'sous',
  "colorMode" TEXT DEFAULT 'couleur',
  "fontDays" TEXT,
  "fontDates" TEXT,
  "fontTitles" TEXT,
  "fontSchedule" TEXT,
  "fontEvents" TEXT,
  "fontNotes" TEXT,
  "fontCalendar" TEXT,
  "quickLinks" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Surveillance
CREATE TABLE IF NOT EXISTS "Surveillance" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "schoolYearId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "time" TEXT,
  "location" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE
);

-- CustomFont
CREATE TABLE IF NOT EXISTS "CustomFont" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "dataUrl" TEXT NOT NULL,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- DsfsEvent (événements officiels DSFS, séparés des événements personnels)
CREATE TABLE IF NOT EXISTS "DsfsEvent" (
  "id" TEXT PRIMARY KEY,
  "schoolYearId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL DEFAULT 'autre',
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE
);

-- SchoolYear
CREATE TABLE IF NOT EXISTS "SchoolYear" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "isActive" INTEGER DEFAULT 0,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Schedule
CREATE TABLE IF NOT EXISTS "Schedule" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "schoolYearId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isDefault" INTEGER DEFAULT 0,
  "effectiveFromDate" DATETIME,
  "effectiveToDate" DATETIME,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE
);

-- ScheduleBlock
CREATE TABLE IF NOT EXISTS "ScheduleBlock" (
  "id" TEXT PRIMARY KEY,
  "scheduleId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "subject" TEXT,
  "color" TEXT DEFAULT '#6366f1',
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE
);

-- CalendarEvent
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "schoolYearId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" DATETIME NOT NULL,
  "startTime" TEXT,
  "endTime" TEXT,
  "type" TEXT DEFAULT 'Personnel',
  "color" TEXT DEFAULT '#6366f1',
  "isAllDay" INTEGER DEFAULT 0,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE
);

-- PlannerEntry
CREATE TABLE IF NOT EXISTS "PlannerEntry" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "schoolYearId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "timeBlock" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "objective" TEXT,
  "activity" TEXT,
  "materials" TEXT,
  "homework" TEXT,
  "evaluation" TEXT,
  "notes" TEXT,
  "resources" TEXT,
  "status" TEXT DEFAULT 'draft',
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE
);

-- Task
CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "schoolYearId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" DATETIME,
  "priority" TEXT DEFAULT 'normal',
  "category" TEXT,
  "status" TEXT DEFAULT 'pending',
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE
);

-- Resource
CREATE TABLE IF NOT EXISTS "Resource" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "parentId" TEXT,
  "url" TEXT,
  "content" TEXT,
  "tags" TEXT,
  "isFavorite" INTEGER DEFAULT 0,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("parentId") REFERENCES "Resource"("id") ON DELETE CASCADE
);

-- Classroom
CREATE TABLE IF NOT EXISTS "Classroom" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "level" TEXT,
  "period" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Student
CREATE TABLE IF NOT EXISTS "Student" (
  "id" TEXT PRIMARY KEY,
  "classroomId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "studentNumber" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE
);

-- Group
CREATE TABLE IF NOT EXISTS "Group" (
  "id" TEXT PRIMARY KEY,
  "classroomId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE
);

-- GroupMember
CREATE TABLE IF NOT EXISTS "GroupMember" (
  "id" TEXT PRIMARY KEY,
  "groupId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "addedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
);

-- Assessment
CREATE TABLE IF NOT EXISTS "Assessment" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "schoolYearId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "competency" TEXT,
  "date" DATETIME NOT NULL,
  "classroomId" TEXT,
  "notes" TEXT,
  "rubric" TEXT,
  "results" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE
);

-- StudentAssessmentResult
CREATE TABLE IF NOT EXISTS "StudentAssessmentResult" (
  "id" TEXT PRIMARY KEY,
  "assessmentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "score" REAL,
  "feedback" TEXT,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
);

-- SharedResource
CREATE TABLE IF NOT EXISTS "SharedResource" (
  "id" TEXT PRIMARY KEY,
  "resourceId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "type" TEXT DEFAULT 'view',
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE,
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Notification
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "relatedId" TEXT,
  "isRead" INTEGER DEFAULT 0,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "Surveillance_userId_idx" ON "Surveillance"("userId");
CREATE INDEX IF NOT EXISTS "Surveillance_schoolYearId_idx" ON "Surveillance"("schoolYearId");
CREATE INDEX IF NOT EXISTS "Surveillance_date_idx" ON "Surveillance"("date");
CREATE INDEX IF NOT EXISTS "CustomFont_userId_idx" ON "CustomFont"("userId");
CREATE INDEX IF NOT EXISTS "DsfsEvent_schoolYearId_idx" ON "DsfsEvent"("schoolYearId");
CREATE INDEX IF NOT EXISTS "SchoolProfile_userId_idx" ON "SchoolProfile"("userId");
CREATE INDEX IF NOT EXISTS "SchoolYear_userId_idx" ON "SchoolYear"("userId");
CREATE INDEX IF NOT EXISTS "SchoolYear_isActive_idx" ON "SchoolYear"("isActive");
CREATE INDEX IF NOT EXISTS "Schedule_userId_idx" ON "Schedule"("userId");
CREATE INDEX IF NOT EXISTS "Schedule_schoolYearId_idx" ON "Schedule"("schoolYearId");
CREATE INDEX IF NOT EXISTS "Schedule_isDefault_idx" ON "Schedule"("isDefault");
CREATE INDEX IF NOT EXISTS "ScheduleBlock_scheduleId_idx" ON "ScheduleBlock"("scheduleId");
CREATE INDEX IF NOT EXISTS "ScheduleBlock_dayOfWeek_idx" ON "ScheduleBlock"("dayOfWeek");
CREATE INDEX IF NOT EXISTS "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_schoolYearId_idx" ON "CalendarEvent"("schoolYearId");
CREATE INDEX IF NOT EXISTS "CalendarEvent_date_idx" ON "CalendarEvent"("date");
CREATE INDEX IF NOT EXISTS "PlannerEntry_userId_idx" ON "PlannerEntry"("userId");
CREATE INDEX IF NOT EXISTS "PlannerEntry_schoolYearId_idx" ON "PlannerEntry"("schoolYearId");
CREATE INDEX IF NOT EXISTS "PlannerEntry_date_idx" ON "PlannerEntry"("date");
CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON "Task"("userId");
CREATE INDEX IF NOT EXISTS "Task_schoolYearId_idx" ON "Task"("schoolYearId");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX IF NOT EXISTS "Resource_userId_idx" ON "Resource"("userId");
CREATE INDEX IF NOT EXISTS "Resource_parentId_idx" ON "Resource"("parentId");
CREATE INDEX IF NOT EXISTS "Resource_isFavorite_idx" ON "Resource"("isFavorite");
CREATE INDEX IF NOT EXISTS "Classroom_userId_idx" ON "Classroom"("userId");
CREATE INDEX IF NOT EXISTS "Student_classroomId_idx" ON "Student"("classroomId");
CREATE INDEX IF NOT EXISTS "Group_classroomId_idx" ON "Group"("classroomId");
CREATE INDEX IF NOT EXISTS "GroupMember_groupId_idx" ON "GroupMember"("groupId");
CREATE INDEX IF NOT EXISTS "GroupMember_studentId_idx" ON "GroupMember"("studentId");
CREATE INDEX IF NOT EXISTS "Assessment_userId_idx" ON "Assessment"("userId");
CREATE INDEX IF NOT EXISTS "Assessment_schoolYearId_idx" ON "Assessment"("schoolYearId");
CREATE INDEX IF NOT EXISTS "Assessment_date_idx" ON "Assessment"("date");
CREATE INDEX IF NOT EXISTS "StudentAssessmentResult_assessmentId_idx" ON "StudentAssessmentResult"("assessmentId");
CREATE INDEX IF NOT EXISTS "StudentAssessmentResult_studentId_idx" ON "StudentAssessmentResult"("studentId");
CREATE INDEX IF NOT EXISTS "SharedResource_resourceId_idx" ON "SharedResource"("resourceId");
CREATE INDEX IF NOT EXISTS "SharedResource_ownerId_idx" ON "SharedResource"("ownerId");
CREATE INDEX IF NOT EXISTS "SharedResource_recipientId_idx" ON "SharedResource"("recipientId");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
`

try {
  const statements = schema.split(';').filter(s => s.trim())
  statements.forEach(sql => {
    if (sql.trim()) {
      db.exec(sql)
    }
  })
  console.log('✓ Database schema created successfully')
  db.close()
  process.exit(0)
} catch (error) {
  console.error('✗ Database error:', error)
  process.exit(1)
}
