import Database from 'better-sqlite3'
import path from 'path'
import { randomBytes } from 'crypto'

const isServerless = !!process.env.VERCEL
const dbPath = isServerless
  ? path.join('/tmp', 'mon-agenda-pedago.db')
  : path.join(process.cwd(), 'prisma', 'dev.db')

function ensureSchema(database: Database.Database) {
  database.pragma('foreign_keys = ON')
  database.exec(`
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
    CREATE TABLE IF NOT EXISTS "CustomFont" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "format" TEXT NOT NULL,
      "dataUrl" TEXT NOT NULL,
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "DsfsEvent" (
      "id" TEXT PRIMARY KEY,
      "schoolYearId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "date" DATETIME NOT NULL,
      "description" TEXT,
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE CASCADE
    );
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
    CREATE TABLE IF NOT EXISTS "Group" (
      "id" TEXT PRIMARY KEY,
      "classroomId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "GroupMember" (
      "id" TEXT PRIMARY KEY,
      "groupId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "addedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE,
      FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
    );
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
    CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
    CREATE INDEX IF NOT EXISTS "Surveillance_userId_idx" ON "Surveillance"("userId");
    CREATE INDEX IF NOT EXISTS "Surveillance_schoolYearId_idx" ON "Surveillance"("schoolYearId");
    CREATE INDEX IF NOT EXISTS "CustomFont_userId_idx" ON "CustomFont"("userId");
    CREATE INDEX IF NOT EXISTS "DsfsEvent_schoolYearId_idx" ON "DsfsEvent"("schoolYearId");
    CREATE INDEX IF NOT EXISTS "SchoolProfile_userId_idx" ON "SchoolProfile"("userId");
    CREATE INDEX IF NOT EXISTS "SchoolYear_userId_idx" ON "SchoolYear"("userId");
    CREATE INDEX IF NOT EXISTS "Schedule_userId_idx" ON "Schedule"("userId");
    CREATE INDEX IF NOT EXISTS "Schedule_schoolYearId_idx" ON "Schedule"("schoolYearId");
    CREATE INDEX IF NOT EXISTS "ScheduleBlock_scheduleId_idx" ON "ScheduleBlock"("scheduleId");
    CREATE INDEX IF NOT EXISTS "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");
    CREATE INDEX IF NOT EXISTS "CalendarEvent_schoolYearId_idx" ON "CalendarEvent"("schoolYearId");
    CREATE INDEX IF NOT EXISTS "PlannerEntry_userId_idx" ON "PlannerEntry"("userId");
    CREATE INDEX IF NOT EXISTS "PlannerEntry_schoolYearId_idx" ON "PlannerEntry"("schoolYearId");
    CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON "Task"("userId");
    CREATE INDEX IF NOT EXISTS "Task_schoolYearId_idx" ON "Task"("schoolYearId");
    CREATE INDEX IF NOT EXISTS "Resource_userId_idx" ON "Resource"("userId");
    CREATE INDEX IF NOT EXISTS "Resource_parentId_idx" ON "Resource"("parentId");
    CREATE INDEX IF NOT EXISTS "Classroom_userId_idx" ON "Classroom"("userId");
    CREATE INDEX IF NOT EXISTS "Student_classroomId_idx" ON "Student"("classroomId");
    CREATE INDEX IF NOT EXISTS "Group_classroomId_idx" ON "Group"("classroomId");
    CREATE INDEX IF NOT EXISTS "GroupMember_groupId_idx" ON "GroupMember"("groupId");
    CREATE INDEX IF NOT EXISTS "GroupMember_studentId_idx" ON "GroupMember"("studentId");
    CREATE INDEX IF NOT EXISTS "Assessment_userId_idx" ON "Assessment"("userId");
    CREATE INDEX IF NOT EXISTS "Assessment_schoolYearId_idx" ON "Assessment"("schoolYearId");
    CREATE INDEX IF NOT EXISTS "SharedResource_ownerId_idx" ON "SharedResource"("ownerId");
    CREATE INDEX IF NOT EXISTS "SharedResource_recipientId_idx" ON "SharedResource"("recipientId");
    CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
  `)
}
let db: Database.Database | null = null

export function getDb() {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    if (isServerless) {
      // Sur Vercel, /tmp est vide à chaque cold start : on recrée le schéma
      // automatiquement si besoin. ATTENTION : les données ne persistent pas
      // entre les cold starts sur cette configuration (voir README).
      ensureSchema(db)
    }
  }
  return db
}

export function generateId() {
  return 'c' + Date.now().toString(36) + randomBytes(8).toString('hex')
}

const BOOLEAN_FIELDS: Record<string, string[]> = {
  UserSettings: ['showWeekends', 'notificationsEnabled'],
  SchoolYear: ['isActive'],
  Schedule: ['isDefault'],
  CalendarEvent: ['isAllDay'],
  Resource: ['isFavorite'],
  Notification: ['isRead'],
}

const DATE_FIELDS: Record<string, string[]> = {
  User: ['createdAt', 'updatedAt'],
  UserSettings: ['createdAt', 'updatedAt'],
  SchoolProfile: ['createdAt', 'updatedAt'],
  SchoolYear: ['createdAt', 'updatedAt', 'startDate', 'endDate'],
  Schedule: ['createdAt', 'updatedAt', 'effectiveFromDate', 'effectiveToDate'],
  ScheduleBlock: ['createdAt', 'updatedAt'],
  CalendarEvent: ['createdAt', 'updatedAt', 'date'],
  PlannerEntry: ['createdAt', 'updatedAt', 'date'],
  Task: ['createdAt', 'updatedAt', 'dueDate'],
  Resource: ['createdAt', 'updatedAt'],
  Classroom: ['createdAt', 'updatedAt'],
  Student: ['createdAt', 'updatedAt'],
  Group: ['createdAt', 'updatedAt'],
  GroupMember: ['addedAt'],
  Assessment: ['createdAt', 'updatedAt', 'date'],
  StudentAssessmentResult: ['createdAt', 'updatedAt'],
  SharedResource: ['createdAt', 'updatedAt'],
  Notification: ['createdAt'],
  Surveillance: ['createdAt', 'updatedAt', 'date'],
  CustomFont: ['createdAt'],
  DsfsEvent: ['createdAt', 'date'],
}

interface RelationDef {
  type: 'hasMany' | 'belongsTo'
  table: string
  foreignKey: string
}

const RELATIONS: Record<string, Record<string, RelationDef>> = {
  User: {
    schoolProfiles: { type: 'hasMany', table: 'SchoolProfile', foreignKey: 'userId' },
    schoolYears: { type: 'hasMany', table: 'SchoolYear', foreignKey: 'userId' },
    schedules: { type: 'hasMany', table: 'Schedule', foreignKey: 'userId' },
    calendarEvents: { type: 'hasMany', table: 'CalendarEvent', foreignKey: 'userId' },
    plannerEntries: { type: 'hasMany', table: 'PlannerEntry', foreignKey: 'userId' },
    tasks: { type: 'hasMany', table: 'Task', foreignKey: 'userId' },
    resources: { type: 'hasMany', table: 'Resource', foreignKey: 'userId' },
    classrooms: { type: 'hasMany', table: 'Classroom', foreignKey: 'userId' },
    assessments: { type: 'hasMany', table: 'Assessment', foreignKey: 'userId' },
    notifications: { type: 'hasMany', table: 'Notification', foreignKey: 'userId' },
  },
  SchoolYear: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
    schedules: { type: 'hasMany', table: 'Schedule', foreignKey: 'schoolYearId' },
    calendarEvents: { type: 'hasMany', table: 'CalendarEvent', foreignKey: 'schoolYearId' },
    plannerEntries: { type: 'hasMany', table: 'PlannerEntry', foreignKey: 'schoolYearId' },
    tasks: { type: 'hasMany', table: 'Task', foreignKey: 'schoolYearId' },
    assessments: { type: 'hasMany', table: 'Assessment', foreignKey: 'schoolYearId' },
  },
  Schedule: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
    schoolYear: { type: 'belongsTo', table: 'SchoolYear', foreignKey: 'schoolYearId' },
    blocks: { type: 'hasMany', table: 'ScheduleBlock', foreignKey: 'scheduleId' },
  },
  ScheduleBlock: {
    schedule: { type: 'belongsTo', table: 'Schedule', foreignKey: 'scheduleId' },
  },
  CalendarEvent: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
    schoolYear: { type: 'belongsTo', table: 'SchoolYear', foreignKey: 'schoolYearId' },
  },
  PlannerEntry: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
    schoolYear: { type: 'belongsTo', table: 'SchoolYear', foreignKey: 'schoolYearId' },
  },
  Task: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
    schoolYear: { type: 'belongsTo', table: 'SchoolYear', foreignKey: 'schoolYearId' },
  },
  Resource: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
    parent: { type: 'belongsTo', table: 'Resource', foreignKey: 'parentId' },
    children: { type: 'hasMany', table: 'Resource', foreignKey: 'parentId' },
  },
  Classroom: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
    students: { type: 'hasMany', table: 'Student', foreignKey: 'classroomId' },
    groups: { type: 'hasMany', table: 'Group', foreignKey: 'classroomId' },
  },
  Student: {
    classroom: { type: 'belongsTo', table: 'Classroom', foreignKey: 'classroomId' },
    assessments: { type: 'hasMany', table: 'StudentAssessmentResult', foreignKey: 'studentId' },
    groupMembers: { type: 'hasMany', table: 'GroupMember', foreignKey: 'studentId' },
  },
  Group: {
    classroom: { type: 'belongsTo', table: 'Classroom', foreignKey: 'classroomId' },
    members: { type: 'hasMany', table: 'GroupMember', foreignKey: 'groupId' },
  },
  GroupMember: {
    group: { type: 'belongsTo', table: 'Group', foreignKey: 'groupId' },
    student: { type: 'belongsTo', table: 'Student', foreignKey: 'studentId' },
  },
  Assessment: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
    schoolYear: { type: 'belongsTo', table: 'SchoolYear', foreignKey: 'schoolYearId' },
    studentResults: { type: 'hasMany', table: 'StudentAssessmentResult', foreignKey: 'assessmentId' },
  },
  StudentAssessmentResult: {
    assessment: { type: 'belongsTo', table: 'Assessment', foreignKey: 'assessmentId' },
    student: { type: 'belongsTo', table: 'Student', foreignKey: 'studentId' },
  },
  SharedResource: {
    resource: { type: 'belongsTo', table: 'Resource', foreignKey: 'resourceId' },
    owner: { type: 'belongsTo', table: 'User', foreignKey: 'ownerId' },
    recipient: { type: 'belongsTo', table: 'User', foreignKey: 'recipientId' },
  },
  Notification: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
  },
  UserSettings: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
  },
  SchoolProfile: {
    user: { type: 'belongsTo', table: 'User', foreignKey: 'userId' },
  },
}

function toSqliteValue(table: string, key: string, value: any) {
  if (value === undefined) return undefined
  if (value === null) return null

  const boolFields = BOOLEAN_FIELDS[table] || []
  if (boolFields.includes(key)) {
    return value ? 1 : 0
  }

  const dateFields = DATE_FIELDS[table] || []
  if (dateFields.includes(key)) {
    if (value instanceof Date) return value.toISOString()
    return value
  }

  return value
}

function fromSqliteRow(table: string, row: any): any {
  if (!row) return row
  const result: any = { ...row }

  const boolFields = BOOLEAN_FIELDS[table] || []
  boolFields.forEach(f => {
    if (f in result) result[f] = !!result[f]
  })

  const dateFields = DATE_FIELDS[table] || []
  dateFields.forEach(f => {
    if (result[f]) result[f] = new Date(result[f])
  })

  return result
}

function resolveIncludes(table: string, row: any, include: Record<string, any>) {
  if (!row) return row
  const relations = RELATIONS[table] || {}

  for (const relName of Object.keys(include)) {
    if (relName === 'settings' && table === 'User') {
      const d = getDb()
      const stmt = d.prepare(`SELECT * FROM "UserSettings" WHERE "userId" = ? LIMIT 1`)
      const settingsRow = stmt.get(row.id)
      row.settings = settingsRow ? fromSqliteRow('UserSettings', settingsRow) : null
      continue
    }

    const relDef = relations[relName]
    if (!relDef) continue

    const includeOptions = include[relName]
    const nestedInclude = includeOptions && typeof includeOptions === 'object' && includeOptions.include
      ? includeOptions.include
      : null
    const nestedOrderBy = includeOptions && typeof includeOptions === 'object' && includeOptions.orderBy
      ? includeOptions.orderBy
      : null
    const nestedWhere = includeOptions && typeof includeOptions === 'object' && includeOptions.where
      ? includeOptions.where
      : null
    const nestedTake = includeOptions && typeof includeOptions === 'object' && includeOptions.take
      ? includeOptions.take
      : null

    if (relDef.type === 'hasMany') {
      const d = getDb()
      let query = `SELECT * FROM "${relDef.table}" WHERE "${relDef.foreignKey}" = ?`
      const params: any[] = [row.id]

      if (nestedWhere) {
        Object.entries(nestedWhere).forEach(([k, v]) => {
          query += ` AND "${k}" = ?`
          params.push(toSqliteValue(relDef.table, k, v))
        })
      }

      if (nestedOrderBy) {
        const orderClauses: string[] = []
        const obArray = Array.isArray(nestedOrderBy) ? nestedOrderBy : [nestedOrderBy]
        obArray.forEach((ob: any) => {
          const [key, dir] = Object.entries(ob)[0] as [string, string]
          orderClauses.push(`"${key}" ${dir.toUpperCase()}`)
        })
        if (orderClauses.length > 0) {
          query += ` ORDER BY ${orderClauses.join(', ')}`
        }
      }

      if (nestedTake) {
        query += ` LIMIT ${nestedTake}`
      }

      const stmt = d.prepare(query)
      let children = stmt.all(...params).map((r: any) => fromSqliteRow(relDef.table, r))

      if (nestedInclude) {
        children = children.map((child: any) => resolveIncludes(relDef.table, child, nestedInclude))
      }

      row[relName] = children
    } else if (relDef.type === 'belongsTo') {
      const fkValue = row[relDef.foreignKey]
      if (!fkValue) {
        row[relName] = null
        continue
      }
      const d = getDb()
      const stmt = d.prepare(`SELECT * FROM "${relDef.table}" WHERE "id" = ? LIMIT 1`)
      const parentRow = stmt.get(fkValue)
      let parent = parentRow ? fromSqliteRow(relDef.table, parentRow) : null

      if (parent && nestedInclude) {
        parent = resolveIncludes(relDef.table, parent, nestedInclude)
      }

      row[relName] = parent
    }
  }

  return row
}

class QueryBuilder {
  private table: string
  private whereConditions: Array<{ key: string; value: any; op?: string }> = []
  private orConditions: Array<Array<{ key: string; value: any }>> = []
  private orderByClauses: Array<{ key: string; dir: string }> = []
  private limitValue: number | null = null
  private offsetValue: number = 0
  private includeOptions: Record<string, any> | null = null

  constructor(table: string) {
    this.table = table
  }

  where(conditions: Record<string, any>) {
    Object.entries(conditions).forEach(([key, value]) => {
      if (key === 'OR' && Array.isArray(value)) {
        this.orConditions.push(value.map((cond: any) => {
          const [k, v] = Object.entries(cond)[0]
          return { key: k, value: v }
        }))
        return
      }
      if (value !== undefined && typeof value === 'object' && value !== null && !(value instanceof Date)) {
        Object.entries(value).forEach(([op, opValue]) => {
          this.whereConditions.push({ key, value: opValue, op })
        })
        return
      }
      this.whereConditions.push({ key, value })
    })
    return this
  }

  orderBy(field: string | Record<string, 'asc' | 'desc'>, dir?: 'asc' | 'desc') {
    if (typeof field === 'string') {
      this.orderByClauses.push({ key: field, dir: (dir || 'asc').toUpperCase() })
    } else if (typeof field === 'object') {
      const [key, direction] = Object.entries(field)[0]
      this.orderByClauses.push({ key, dir: direction.toUpperCase() })
    }
    return this
  }

  include(relations: Record<string, any>) {
    this.includeOptions = relations
    return this
  }

  take(n: number) {
    this.limitValue = n
    return this
  }

  skip(n: number) {
    this.offsetValue = n
    return this
  }

  private opToSql(op: string): string {
    switch (op) {
      case 'gte': return '>='
      case 'gt': return '>'
      case 'lte': return '<='
      case 'lt': return '<'
      case 'not': return '!='
      default: return '='
    }
  }

  private buildWhere() {
    const clauses: string[] = []
    const values: any[] = []

    this.whereConditions.forEach(({ key, value, op }) => {
      if (op === 'in' && Array.isArray(value)) {
        clauses.push(`"${key}" IN (${value.map(() => '?').join(',')})`)
        value.forEach(v => values.push(toSqliteValue(this.table, key, v)))
      } else if (op === 'contains') {
        clauses.push(`"${key}" LIKE ?`)
        values.push(`%${value}%`)
      } else {
        const sqlValue = toSqliteValue(this.table, key, value)
        if (sqlValue === null || sqlValue === undefined) {
          clauses.push(op === 'not' ? `"${key}" IS NOT NULL` : `"${key}" IS NULL`)
        } else {
          const sqlOp = op ? this.opToSql(op) : '='
          clauses.push(`"${key}" ${sqlOp} ?`)
          values.push(sqlValue instanceof Date ? sqlValue.toISOString() : sqlValue)
        }
      }
    })

    if (this.orConditions.length > 0) {
      this.orConditions.forEach(orGroup => {
        const orClauses = orGroup.map(({ key, value }) => {
          values.push(toSqliteValue(this.table, key, value))
          return `"${key}" = ?`
        })
        clauses.push(`(${orClauses.join(' OR ')})`)
      })
    }

    if (clauses.length === 0) return { clause: '', values: [] }
    return { clause: ' WHERE ' + clauses.join(' AND '), values }
  }

  private buildOrderBy() {
    if (this.orderByClauses.length === 0) return ''
    const clauses = this.orderByClauses.map(({ key, dir }) => `"${key}" ${dir}`)
    return ` ORDER BY ${clauses.join(', ')}`
  }

  private buildLimit() {
    let clause = ''
    if (this.limitValue) clause += ` LIMIT ${this.limitValue}`
    if (this.offsetValue) clause += ` OFFSET ${this.offsetValue}`
    return clause
  }

  findMany() {
    const d = getDb()
    const where = this.buildWhere()
    const orderBy = this.buildOrderBy()
    const limit = this.buildLimit()

    const query = `SELECT * FROM "${this.table}"${where.clause}${orderBy}${limit}`
    const stmt = d.prepare(query)
    let rows = stmt.all(...where.values).map((r: any) => fromSqliteRow(this.table, r))

    if (this.includeOptions) {
      rows = rows.map((r: any) => resolveIncludes(this.table, r, this.includeOptions!))
    }

    return rows
  }

  findUnique() {
    const d = getDb()
    const where = this.buildWhere()
    const query = `SELECT * FROM "${this.table}"${where.clause} LIMIT 1`
    const stmt = d.prepare(query)
    let row = stmt.get(...where.values) as any
    row = fromSqliteRow(this.table, row)

    if (row && this.includeOptions) {
      row = resolveIncludes(this.table, row, this.includeOptions)
    }

    return row || null
  }

  count() {
    const d = getDb()
    const where = this.buildWhere()
    const query = `SELECT COUNT(*) as count FROM "${this.table}"${where.clause}`
    const stmt = d.prepare(query)
    const result = stmt.get(...where.values) as any
    return result?.count || 0
  }

  updateMany(data: Record<string, any>) {
    const d = getDb()
    const where = this.buildWhere()
    const keys = Object.keys(data)
    if (keys.length === 0) return { count: 0 }

    const now = new Date().toISOString()
    const hasUpdatedAt = (DATE_FIELDS[this.table] || []).includes('updatedAt')
    const setClause = keys.map(k => `"${k}" = ?`).join(', ') + (hasUpdatedAt ? `, "updatedAt" = ?` : '')
    const values = keys.map(k => toSqliteValue(this.table, k, data[k]))
    if (hasUpdatedAt) values.push(now)

    const query = `UPDATE "${this.table}" SET ${setClause}${where.clause}`
    const stmt = d.prepare(query)
    const result = stmt.run(...values, ...where.values)
    return { count: result.changes }
  }

  deleteMany() {
    const d = getDb()
    const where = this.buildWhere()
    const query = `DELETE FROM "${this.table}"${where.clause}`
    const stmt = d.prepare(query)
    const result = stmt.run(...where.values)
    return { count: result.changes }
  }
}

class ModelAPI {
  constructor(private table: string) {}

  private query() {
    return new QueryBuilder(this.table)
  }

  private applyOrderBy(qb: QueryBuilder, orderBy: any) {
    if (!orderBy) return qb
    if (Array.isArray(orderBy)) {
      orderBy.forEach((ob: any) => qb.orderBy(ob))
    } else {
      qb.orderBy(orderBy)
    }
    return qb
  }

  findMany(options?: any) {
    let qb = this.query()
    if (options?.where) qb = qb.where(options.where)
    qb = this.applyOrderBy(qb, options?.orderBy)
    if (options?.include) qb = qb.include(options.include)
    if (options?.take) qb = qb.take(options.take)
    if (options?.skip) qb = qb.skip(options.skip)
    return qb.findMany()
  }

  findUnique(options: any) {
    if (!options?.where) return null
    let qb = this.query().where(options.where)
    if (options?.include) qb = qb.include(options.include)
    return qb.findUnique()
  }

  findFirst(options: any) {
    let qb = this.query()
    if (options?.where) qb = qb.where(options.where)
    qb = this.applyOrderBy(qb, options?.orderBy)
    if (options?.include) qb = qb.include(options.include)
    return qb.findUnique()
  }

  create(options: any) {
    const d = getDb()
    const data: any = { ...(options.data || {}) }

    if (!data.id) data.id = generateId()

    const now = new Date().toISOString()
    const dateFields = DATE_FIELDS[this.table] || []
    if (dateFields.includes('createdAt') && !data.createdAt) data.createdAt = now
    if (dateFields.includes('updatedAt') && !data.updatedAt) data.updatedAt = now

    const keys = Object.keys(data).filter(k => data[k] !== undefined)
    const placeholders = keys.map(() => '?').join(',')
    const query = `INSERT INTO "${this.table}" (${keys.map(k => `"${k}"`).join(',')}) VALUES (${placeholders})`
    const stmt = d.prepare(query)
    const values = keys.map(k => {
      const v = data[k]
      if (v instanceof Date) return v.toISOString()
      return toSqliteValue(this.table, k, v)
    })

    stmt.run(...values)

    let created = this.findUnique({ where: { id: data.id } })
    if (options.include) {
      created = resolveIncludes(this.table, created, options.include)
    }
    return created
  }

  update(options: any) {
    const d = getDb()
    const data: any = { ...(options.data || {}) }
    const where = options.where || {}
    const whereKeys = Object.keys(where)

    if (whereKeys.length === 0) return null

    const dateFields = DATE_FIELDS[this.table] || []
    if (dateFields.includes('updatedAt')) data.updatedAt = new Date().toISOString()

    const keys = Object.keys(data).filter(k => data[k] !== undefined)
    if (keys.length === 0) {
      return this.findUnique({ where, include: options.include })
    }

    const setClause = keys.map(k => `"${k}" = ?`).join(', ')
    const whereClause = whereKeys.map(k => `"${k}" = ?`).join(' AND ')
    const query = `UPDATE "${this.table}" SET ${setClause} WHERE ${whereClause}`
    const stmt = d.prepare(query)
    const values = [
      ...keys.map(k => {
        const v = data[k]
        if (v instanceof Date) return v.toISOString()
        return toSqliteValue(this.table, k, v)
      }),
      ...whereKeys.map(k => toSqliteValue(this.table, k, where[k]))
    ]

    stmt.run(...values)

    let updated = this.findUnique({ where })
    if (options.include) {
      updated = resolveIncludes(this.table, updated, options.include)
    }
    return updated
  }

  updateMany(options: any) {
    let qb = this.query()
    if (options?.where) qb = qb.where(options.where)
    return qb.updateMany(options.data || {})
  }

  delete(options: any) {
    const where = options.where || {}
    const whereKeys = Object.keys(where)
    if (whereKeys.length === 0) return null

    const existing = this.findUnique({ where })

    const d = getDb()
    const whereClause = whereKeys.map(k => `"${k}" = ?`).join(' AND ')
    const query = `DELETE FROM "${this.table}" WHERE ${whereClause}`
    const stmt = d.prepare(query)
    const values = whereKeys.map(k => toSqliteValue(this.table, k, where[k]))
    stmt.run(...values)

    return existing
  }

  deleteMany(options?: any) {
    let qb = this.query()
    if (options?.where) qb = qb.where(options.where)
    return qb.deleteMany()
  }

  count(options?: any) {
    let qb = this.query()
    if (options?.where) qb = qb.where(options.where)
    return qb.count()
  }

  upsert(options: any) {
    const existing = this.findUnique({ where: options.where })
    if (existing) {
      return this.update({ where: options.where, data: options.update, include: options.include })
    } else {
      const createData = { ...options.where, ...options.create }
      return this.create({ data: createData, include: options.include })
    }
  }
}

const MODEL_TABLE_MAP: Record<string, string> = {
  user: 'User',
  userSettings: 'UserSettings',
  schoolProfile: 'SchoolProfile',
  schoolYear: 'SchoolYear',
  schedule: 'Schedule',
  scheduleBlock: 'ScheduleBlock',
  calendarEvent: 'CalendarEvent',
  plannerEntry: 'PlannerEntry',
  task: 'Task',
  resource: 'Resource',
  classroom: 'Classroom',
  student: 'Student',
  group: 'Group',
  groupMember: 'GroupMember',
  assessment: 'Assessment',
  studentAssessmentResult: 'StudentAssessmentResult',
  sharedResource: 'SharedResource',
  notification: 'Notification',
  surveillance: 'Surveillance',
  customFont: 'CustomFont',
  dsfsEvent: 'DsfsEvent',
}

export class PrismaClient {
  [key: string]: ModelAPI

  constructor() {
    return new Proxy(this, {
      get: (target, prop: string) => {
        if (typeof prop === 'string' && !['constructor', 'toString', 'then'].includes(prop)) {
          const tableName = MODEL_TABLE_MAP[prop] || (prop.charAt(0).toUpperCase() + prop.slice(1))
          return new ModelAPI(tableName)
        }
        return (target as any)[prop]
      }
    }) as any
  }
}

export const prisma = new PrismaClient() as any
