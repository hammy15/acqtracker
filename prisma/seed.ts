import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Seeding AcqTracker database…\n");

  // ─────────────────────────────────────────────
  // CLEANUP (idempotent)
  // ─────────────────────────────────────────────
  console.log("Cleaning existing data…");
  await prisma.aiMessage.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.otaAnalysis.deleteMany();
  await prisma.otaDocument.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.userPresence.deleteMany();
  await prisma.buildingAssignment.deleteMany();
  await prisma.feedPost.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatChannel.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskFile.deleteMany();
  await prisma.task.deleteMany();
  await prisma.dueDiligenceDoc.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.templateTask.deleteMany();
  await prisma.template.deleteMany();
  await prisma.stateRequirement.deleteMany();
  await prisma.user.deleteMany();
  await prisma.region.deleteMany();
  await prisma.orgSettings.deleteMany();
  await prisma.organization.deleteMany();

  // ─────────────────────────────────────────────
  // 1. ORGANIZATION
  // ─────────────────────────────────────────────
  console.log("Creating organization…");
  const org = await prisma.organization.create({
    data: {
      name: "Cascadia Healthcare Group",
      settings: {
        defaultFacilityType: "SNF",
        timezone: "America/Los_Angeles",
        dateFormat: "MM/dd/yyyy",
        requirePhotoVerification: true,
        autoCreateChannels: true,
        defaultChannels: ["general", "clinical", "regulatory", "facilities", "financial"],
        maxUploadSizeMB: 50,
        retentionDays: 730,
        features: {
          chat: true,
          feed: true,
          transitionDay: true,
          stateRequirements: true,
          dueDiligenceDocs: true,
          otaAnalysis: true,
          aiAssistant: true,
        },
      },
    },
  });

  // ─────────────────────────────────────────────
  // 1b. ORG SETTINGS
  // ─────────────────────────────────────────────
  console.log("Creating org settings…");
  await prisma.orgSettings.create({
    data: {
      orgId: org.id,
      timezone: "America/Los_Angeles",
      dateFormat: "MMM DD, YYYY",
      emailNotifications: true,
      dailyDigest: true,
      weeklyReport: true,
      transitionAlerts: true,
      sessionTimeoutMinutes: 60,
      customWorkstreams: [
        { id: "ws-1", label: "Clinical Operations", color: "#14b8a6", isDefault: true, isActive: true },
        { id: "ws-2", label: "Regulatory & Compliance", color: "#f59e0b", isDefault: true, isActive: true },
        { id: "ws-3", label: "Financial", color: "#3b82f6", isDefault: true, isActive: true },
        { id: "ws-4", label: "Physical Plant", color: "#8b5cf6", isDefault: true, isActive: true },
        { id: "ws-5", label: "HR & Staffing", color: "#ef4444", isDefault: true, isActive: true },
        { id: "ws-6", label: "IT & Systems", color: "#06b6d4", isDefault: true, isActive: true },
        { id: "ws-7", label: "Legal", color: "#6366f1", isDefault: true, isActive: true },
        { id: "ws-8", label: "Site Security", color: "#64748b", isDefault: true, isActive: true },
        { id: "ws-9", label: "Photography", color: "#ec4899", isDefault: true, isActive: true },
      ],
      customFacilityTypes: [
        { id: "ft-1", label: "SNF", color: "#14b8a6", isDefault: true, isActive: true },
        { id: "ft-2", label: "ALF", color: "#3b82f6", isDefault: true, isActive: true },
        { id: "ft-3", label: "ILF", color: "#8b5cf6", isDefault: true, isActive: true },
        { id: "ft-4", label: "Hospice", color: "#f59e0b", isDefault: true, isActive: true },
        { id: "ft-5", label: "In-Home", color: "#ef4444", isDefault: true, isActive: true },
        { id: "ft-6", label: "Memory Care", color: "#ec4899", isDefault: true, isActive: true },
        { id: "ft-7", label: "CCRC", color: "#06b6d4", isDefault: true, isActive: true },
      ],
      customTaskPhases: [
        { id: "tp-1", label: "Pre-Close", color: "#f59e0b", isDefault: true, isActive: true },
        { id: "tp-2", label: "Day Of", color: "#ef4444", isDefault: true, isActive: true },
        { id: "tp-3", label: "Week 1", color: "#14b8a6", isDefault: true, isActive: true },
        { id: "tp-4", label: "Week 2", color: "#3b82f6", isDefault: true, isActive: true },
        { id: "tp-5", label: "Post-Close", color: "#8b5cf6", isDefault: true, isActive: true },
      ],
      customDealStatuses: [
        { id: "ds-1", label: "Pipeline", color: "#94a3b8", isDefault: true, isActive: true },
        { id: "ds-2", label: "LOI", color: "#3b82f6", isDefault: true, isActive: true },
        { id: "ds-3", label: "Due Diligence", color: "#f59e0b", isDefault: true, isActive: true },
        { id: "ds-4", label: "CHOW Filed", color: "#14b8a6", isDefault: true, isActive: true },
        { id: "ds-5", label: "Closing", color: "#22c55e", isDefault: true, isActive: true },
        { id: "ds-6", label: "Transition Day", color: "#06b6d4", isDefault: true, isActive: true },
        { id: "ds-7", label: "Week 1", color: "#14b8a6", isDefault: true, isActive: true },
        { id: "ds-8", label: "Week 2", color: "#0d9488", isDefault: true, isActive: true },
        { id: "ds-9", label: "Post-Close", color: "#6366f1", isDefault: true, isActive: true },
      ],
      customRoles: [
        { id: "r-1", label: "Building Lead", color: "#14b8a6", isDefault: true, isActive: true },
        { id: "r-2", label: "Clinical Lead", color: "#ef4444", isDefault: true, isActive: true },
        { id: "r-3", label: "Regulatory Lead", color: "#f59e0b", isDefault: true, isActive: true },
        { id: "r-4", label: "Financial Lead", color: "#3b82f6", isDefault: true, isActive: true },
        { id: "r-5", label: "IT Lead", color: "#06b6d4", isDefault: true, isActive: true },
        { id: "r-6", label: "HR Lead", color: "#8b5cf6", isDefault: true, isActive: true },
        { id: "r-7", label: "Team Member", color: "#64748b", isDefault: true, isActive: true },
      ],
    },
  });

  // ─────────────────────────────────────────────
  // 2. USERS (10 total)
  // ─────────────────────────────────────────────
  console.log("Creating users…");
  const teamPassword = await bcrypt.hash("password123", 12);
  const godPassword = await bcrypt.hash("jockibox26", 12);

  const owen = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "owen",
      passwordHash: godPassword,
      name: "Owen",
      role: "SUPER_ADMIN",
      phone: "+1-208-555-0100",
    },
  });

  const steve = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "steve.anderson@cascadia.com",
      passwordHash: teamPassword,
      name: "Steve Anderson",
      role: "ADMIN",
      phone: "+1-208-555-0101",
    },
  });

  const doug = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "doug.martinez@cascadia.com",
      passwordHash: teamPassword,
      name: "Doug Martinez",
      role: "REGIONAL_LEAD",
      phone: "+1-503-555-0102",
    },
  });

  const sarah = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "sarah.chen@cascadia.com",
      passwordHash: teamPassword,
      name: "Sarah Chen",
      role: "DEAL_LEAD",
      phone: "+1-208-555-0103",
    },
  });

  const tim = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "tim.brooks@cascadia.com",
      passwordHash: teamPassword,
      name: "Tim Brooks",
      role: "DEPARTMENT_LEAD",
      phone: "+1-503-555-0104",
    },
  });

  const james = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "james.peterson@cascadia.com",
      passwordHash: teamPassword,
      name: "James Peterson",
      role: "TEAM_MEMBER",
      phone: "+1-916-555-0105",
    },
  });

  const maria = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "maria.gonzalez@cascadia.com",
      passwordHash: teamPassword,
      name: "Maria Gonzalez",
      role: "DEAL_LEAD",
      phone: "+1-503-555-0106",
    },
  });

  const kevin = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "kevin.nguyen@cascadia.com",
      passwordHash: teamPassword,
      name: "Kevin Nguyen",
      role: "DEPARTMENT_LEAD",
      phone: "+1-206-555-0107",
    },
  });

  const rachel = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "rachel.kim@cascadia.com",
      passwordHash: teamPassword,
      name: "Rachel Kim",
      role: "TEAM_MEMBER",
      phone: "+1-208-555-0108",
    },
  });

  const viewer = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "investor@cascadia.com",
      passwordHash: teamPassword,
      name: "David Thornton",
      role: "VIEWER",
      phone: "+1-415-555-0109",
    },
  });

  const allUsers = [owen, steve, doug, sarah, tim, james, maria, kevin, rachel, viewer];
  const activeUsers = allUsers.filter((u) => u.role !== "VIEWER");

  // ─────────────────────────────────────────────
  // 3. REGIONS
  // ─────────────────────────────────────────────
  console.log("Creating regions…");
  const pacificNW = await prisma.region.create({
    data: { orgId: org.id, name: "Pacific Northwest", states: ["OR", "WA"], regionalLeadId: doug.id },
  });

  const idahoMontana = await prisma.region.create({
    data: { orgId: org.id, name: "Idaho / Montana", states: ["ID", "MT"], regionalLeadId: steve.id },
  });

  const california = await prisma.region.create({
    data: { orgId: org.id, name: "California", states: ["CA"], regionalLeadId: maria.id },
  });

  const southwest = await prisma.region.create({
    data: { orgId: org.id, name: "Southwest", states: ["AZ", "NV", "UT"], regionalLeadId: kevin.id },
  });

  // Assign users to regions
  await prisma.user.update({ where: { id: doug.id }, data: { regionId: pacificNW.id } });
  await prisma.user.update({ where: { id: tim.id }, data: { regionId: pacificNW.id } });
  await prisma.user.update({ where: { id: sarah.id }, data: { regionId: idahoMontana.id } });
  await prisma.user.update({ where: { id: james.id }, data: { regionId: california.id } });
  await prisma.user.update({ where: { id: maria.id }, data: { regionId: california.id } });
  await prisma.user.update({ where: { id: kevin.id }, data: { regionId: southwest.id } });
  await prisma.user.update({ where: { id: rachel.id }, data: { regionId: idahoMontana.id } });

  // ─────────────────────────────────────────────
  // 4. TEMPLATES
  // ─────────────────────────────────────────────
  console.log("Creating templates…");

  // ── SNF PRE-CLOSE ──
  const snfPreClose = await prisma.template.create({
    data: {
      orgId: org.id,
      name: "SNF Pre-Close Checklist",
      templateType: "PRE_CLOSE",
      facilityType: "SNF",
      isDefault: true,
      createdById: owen.id,
    },
  });

  const snfPreCloseTasks = [
    // Clinical Operations
    { workstream: "Clinical Operations", section: "Nursing", title: "Review current staffing levels and schedules", sortOrder: 1 },
    { workstream: "Clinical Operations", section: "Nursing", title: "Verify RN/LVN/CNA ratios meet state requirements", sortOrder: 2 },
    { workstream: "Clinical Operations", section: "Nursing", title: "Obtain copy of current nursing policies and procedures", sortOrder: 3 },
    { workstream: "Clinical Operations", section: "Nursing", title: "Review infection control program", sortOrder: 4 },
    { workstream: "Clinical Operations", section: "Nursing", title: "Assess current clinical documentation practices", sortOrder: 5 },
    { workstream: "Clinical Operations", section: "Pharmacy", title: "Review pharmacy consultant contract", sortOrder: 6 },
    { workstream: "Clinical Operations", section: "Pharmacy", title: "Verify narcotics storage and count procedures", sortOrder: 7 },
    { workstream: "Clinical Operations", section: "Pharmacy", title: "Review medication administration records", sortOrder: 8 },
    { workstream: "Clinical Operations", section: "Dietary", title: "Review dietary service contract or in-house program", sortOrder: 9 },
    { workstream: "Clinical Operations", section: "Dietary", title: "Verify food service licenses and health inspections", sortOrder: 10 },
    { workstream: "Clinical Operations", section: "Dietary", title: "Review therapeutic diet capabilities", sortOrder: 11 },
    // Regulatory & Compliance
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "File Change of Ownership (CHOW) application", sortOrder: 12 },
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "Obtain new facility license", sortOrder: 13 },
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "Update Medicare/Medicaid certification", sortOrder: 14 },
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "Verify fire marshal inspection current", sortOrder: 15 },
    { workstream: "Regulatory & Compliance", section: "Surveys", title: "Obtain last 3 years of survey results", sortOrder: 16 },
    { workstream: "Regulatory & Compliance", section: "Surveys", title: "Review plan of correction history", sortOrder: 17 },
    { workstream: "Regulatory & Compliance", section: "Surveys", title: "Identify any current IJ citations", sortOrder: 18 },
    // Financial
    { workstream: "Financial", section: "Revenue", title: "Analyze current payer mix", sortOrder: 19 },
    { workstream: "Financial", section: "Revenue", title: "Review Medicare Part A billing history", sortOrder: 20 },
    { workstream: "Financial", section: "Revenue", title: "Review Medicaid rate and pending rate changes", sortOrder: 21 },
    { workstream: "Financial", section: "Revenue", title: "Analyze managed care contracts", sortOrder: 22 },
    { workstream: "Financial", section: "Expenses", title: "Review current vendor contracts", sortOrder: 23 },
    { workstream: "Financial", section: "Expenses", title: "Analyze staffing costs vs benchmarks", sortOrder: 24 },
    { workstream: "Financial", section: "Expenses", title: "Review utility costs and contracts", sortOrder: 25 },
    { workstream: "Financial", section: "Expenses", title: "Assess insurance coverage and costs", sortOrder: 26 },
    // Physical Plant
    { workstream: "Physical Plant", section: "Building", title: "Conduct building walk-through inspection", sortOrder: 27, requiresPhoto: true },
    { workstream: "Physical Plant", section: "Building", title: "Review recent capital expenditures", sortOrder: 28 },
    { workstream: "Physical Plant", section: "Building", title: "Assess HVAC system condition", sortOrder: 29 },
    { workstream: "Physical Plant", section: "Building", title: "Review roof condition and warranty", sortOrder: 30 },
    { workstream: "Physical Plant", section: "Building", title: "Inspect fire safety systems", sortOrder: 31, requiresPhoto: true },
    { workstream: "Physical Plant", section: "Equipment", title: "Inventory major medical equipment", sortOrder: 32 },
    { workstream: "Physical Plant", section: "Equipment", title: "Verify equipment maintenance records", sortOrder: 33 },
    { workstream: "Physical Plant", section: "Equipment", title: "Assess laundry equipment condition", sortOrder: 34 },
    // HR & Staffing
    { workstream: "HR & Staffing", section: "Personnel", title: "Obtain employee census and roster", sortOrder: 35 },
    { workstream: "HR & Staffing", section: "Personnel", title: "Review employee benefit programs", sortOrder: 36 },
    { workstream: "HR & Staffing", section: "Personnel", title: "Verify background check compliance", sortOrder: 37 },
    { workstream: "HR & Staffing", section: "Personnel", title: "Review workers compensation history", sortOrder: 38 },
    { workstream: "HR & Staffing", section: "Contracts", title: "Review management agreements", sortOrder: 39 },
    { workstream: "HR & Staffing", section: "Contracts", title: "Review therapy contract (PT/OT/SLP)", sortOrder: 40 },
    { workstream: "HR & Staffing", section: "Contracts", title: "Review staffing agency utilization", sortOrder: 41 },
    // IT & Systems
    { workstream: "IT & Systems", section: "Technology", title: "Assess EHR system and contract", sortOrder: 42 },
    { workstream: "IT & Systems", section: "Technology", title: "Review phone/internet service contracts", sortOrder: 43 },
    { workstream: "IT & Systems", section: "Technology", title: "Verify data backup procedures", sortOrder: 44 },
    { workstream: "IT & Systems", section: "Technology", title: "Assess WiFi coverage throughout facility", sortOrder: 45 },
  ];

  const createdSNFTasks = await Promise.all(
    snfPreCloseTasks.map((t) =>
      prisma.templateTask.create({
        data: {
          templateId: snfPreClose.id,
          workstream: t.workstream,
          section: t.section,
          title: t.title,
          sortOrder: t.sortOrder,
          requiresPhoto: (t as any).requiresPhoto ?? false,
          phase: "PRE_CLOSE",
        },
      })
    )
  );

  // ── ALF PRE-CLOSE ──
  const alfPreClose = await prisma.template.create({
    data: {
      orgId: org.id,
      name: "ALF Pre-Close Checklist",
      templateType: "PRE_CLOSE",
      facilityType: "ALF",
      isDefault: true,
      createdById: owen.id,
    },
  });

  const alfPreCloseTasks = [
    { workstream: "Clinical Operations", section: "Care Services", title: "Review current care service levels and ADL support", sortOrder: 1 },
    { workstream: "Clinical Operations", section: "Care Services", title: "Verify medication management program compliance", sortOrder: 2 },
    { workstream: "Clinical Operations", section: "Care Services", title: "Assess memory care program (if applicable)", sortOrder: 3 },
    { workstream: "Clinical Operations", section: "Activities", title: "Review resident activity programming", sortOrder: 4 },
    { workstream: "Clinical Operations", section: "Activities", title: "Assess transportation services", sortOrder: 5 },
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "File Change of Ownership application", sortOrder: 6 },
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "Verify administrator certification current", sortOrder: 7 },
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "Review last inspection report", sortOrder: 8 },
    { workstream: "Financial", section: "Revenue", title: "Review private-pay rate structure", sortOrder: 9 },
    { workstream: "Financial", section: "Revenue", title: "Analyze occupancy trends (24 months)", sortOrder: 10 },
    { workstream: "Financial", section: "Revenue", title: "Review Medicaid waiver participation", sortOrder: 11 },
    { workstream: "Financial", section: "Expenses", title: "Analyze food service costs per resident day", sortOrder: 12 },
    { workstream: "Financial", section: "Expenses", title: "Review maintenance and grounds contracts", sortOrder: 13 },
    { workstream: "Physical Plant", section: "Building", title: "Inspect common areas and dining room", sortOrder: 14, requiresPhoto: true },
    { workstream: "Physical Plant", section: "Building", title: "Assess ADA compliance", sortOrder: 15 },
    { workstream: "Physical Plant", section: "Building", title: "Review emergency call system", sortOrder: 16 },
    { workstream: "HR & Staffing", section: "Personnel", title: "Review caregiver-to-resident ratios", sortOrder: 17 },
    { workstream: "HR & Staffing", section: "Personnel", title: "Verify caregiver training certifications", sortOrder: 18 },
    { workstream: "IT & Systems", section: "Technology", title: "Assess resident management software", sortOrder: 19 },
    { workstream: "IT & Systems", section: "Technology", title: "Review security camera system", sortOrder: 20 },
  ];

  const createdALFTasks = await Promise.all(
    alfPreCloseTasks.map((t) =>
      prisma.templateTask.create({
        data: {
          templateId: alfPreClose.id,
          workstream: t.workstream,
          section: t.section,
          title: t.title,
          sortOrder: t.sortOrder,
          requiresPhoto: (t as any).requiresPhoto ?? false,
          phase: "PRE_CLOSE",
        },
      })
    )
  );

  // ── SNF TRANSITION DAY ──
  const snfDayOf = await prisma.template.create({
    data: {
      orgId: org.id,
      name: "SNF Transition Day Checklist",
      templateType: "DAY_OF",
      facilityType: "SNF",
      isDefault: true,
      createdById: owen.id,
    },
  });

  const dayOfTaskDefs = [
    { workstream: "Site Security", title: "Collect all keys from seller", sortOrder: 1, requiresPhoto: true },
    { workstream: "Site Security", title: "Change safe combination", sortOrder: 2 },
    { workstream: "Site Security", title: "Verify alarm codes changed", sortOrder: 3 },
    { workstream: "Site Security", title: "Photograph lobby and entrance", sortOrder: 4, requiresPhoto: true },
    { workstream: "Site Security", title: "Photograph all exterior doors", sortOrder: 5, requiresPhoto: true },
    { workstream: "Clinical Handoff", title: "Verify narcotics count with outgoing DNS", sortOrder: 6, requiresPhoto: true },
    { workstream: "Clinical Handoff", title: "Complete resident census verification", sortOrder: 7 },
    { workstream: "Clinical Handoff", title: "Review 24-hour nursing report", sortOrder: 8 },
    { workstream: "Clinical Handoff", title: "Verify crash cart contents and seal", sortOrder: 9, requiresPhoto: true },
    { workstream: "Clinical Handoff", title: "Check controlled substance log", sortOrder: 10 },
    { workstream: "Financial Cutoff", title: "Verify petty cash count", sortOrder: 11, requiresPhoto: true },
    { workstream: "Financial Cutoff", title: "Document accounts receivable cutoff", sortOrder: 12 },
    { workstream: "Financial Cutoff", title: "Record utility meter readings", sortOrder: 13, requiresPhoto: true },
    { workstream: "Systems Transfer", title: "Verify phone system transfer", sortOrder: 14 },
    { workstream: "Systems Transfer", title: "Check EHR system access", sortOrder: 15 },
    { workstream: "Systems Transfer", title: "Test fire panel all zones", sortOrder: 16 },
    { workstream: "Systems Transfer", title: "Verify internet connectivity", sortOrder: 17 },
    { workstream: "Systems Transfer", title: "Test nurse call system", sortOrder: 18 },
    { workstream: "Photography", title: "Photograph kitchen and dining", sortOrder: 19, requiresPhoto: true },
    { workstream: "Photography", title: "Photograph all resident wings", sortOrder: 20, requiresPhoto: true },
    { workstream: "Photography", title: "Photograph therapy gym", sortOrder: 21, requiresPhoto: true },
    { workstream: "Photography", title: "Photograph mechanical/utility rooms", sortOrder: 22, requiresPhoto: true },
    { workstream: "Photography", title: "Photograph parking lot and exterior", sortOrder: 23, requiresPhoto: true },
  ];

  await Promise.all(
    dayOfTaskDefs.map((t) =>
      prisma.templateTask.create({
        data: {
          templateId: snfDayOf.id,
          workstream: t.workstream,
          title: t.title,
          sortOrder: t.sortOrder,
          requiresPhoto: t.requiresPhoto ?? false,
          phase: "DAY_OF",
        },
      })
    )
  );

  // ── ALF TRANSITION DAY ──
  const alfDayOf = await prisma.template.create({
    data: {
      orgId: org.id,
      name: "ALF Transition Day Checklist",
      templateType: "DAY_OF",
      facilityType: "ALF",
      createdById: owen.id,
    },
  });

  const alfDayOfTasks = [
    { workstream: "Site Security", title: "Collect all keys and fobs from seller", sortOrder: 1, requiresPhoto: true },
    { workstream: "Site Security", title: "Change door codes and gate codes", sortOrder: 2 },
    { workstream: "Site Security", title: "Photograph all common areas", sortOrder: 3, requiresPhoto: true },
    { workstream: "Resident Services", title: "Verify resident roster and unit assignments", sortOrder: 4 },
    { workstream: "Resident Services", title: "Review medication distribution schedules", sortOrder: 5 },
    { workstream: "Resident Services", title: "Confirm meal service plan for transition day", sortOrder: 6 },
    { workstream: "Financial Cutoff", title: "Document resident trust account balances", sortOrder: 7 },
    { workstream: "Financial Cutoff", title: "Verify security deposit records", sortOrder: 8 },
    { workstream: "Systems Transfer", title: "Verify resident management system access", sortOrder: 9 },
    { workstream: "Systems Transfer", title: "Test emergency pendant system", sortOrder: 10 },
    { workstream: "Photography", title: "Photograph resident rooms (sample)", sortOrder: 11, requiresPhoto: true },
    { workstream: "Photography", title: "Photograph grounds and landscaping", sortOrder: 12, requiresPhoto: true },
  ];

  await Promise.all(
    alfDayOfTasks.map((t) =>
      prisma.templateTask.create({
        data: {
          templateId: alfDayOf.id,
          workstream: t.workstream,
          title: t.title,
          sortOrder: t.sortOrder,
          requiresPhoto: t.requiresPhoto ?? false,
          phase: "DAY_OF",
        },
      })
    )
  );

  const channelNames = ["general", "clinical", "regulatory", "facilities", "financial"];

  // Helper: create channels for a deal
  async function createChannels(dealId: string) {
    const channels: Record<string, Awaited<ReturnType<typeof prisma.chatChannel.create>>> = {};
    for (const name of channelNames) {
      channels[name] = await prisma.chatChannel.create({
        data: { dealId, name, channelType: "AUTO" },
      });
    }
    return channels;
  }

  // Helper: create tasks from template definitions for a deal
  async function createDealTasks(
    dealId: string,
    templateTasks: typeof snfPreCloseTasks,
    createdTemplateTasks: typeof createdSNFTasks,
    config: {
      completeCount: number;
      inProgressCount: number;
      blockedCount: number;
      blockReasons?: string[];
      phase?: "PRE_CLOSE" | "DAY_OF";
    }
  ) {
    const { completeCount, inProgressCount, blockedCount, blockReasons = [], phase = "PRE_CLOSE" } = config;
    const tasks = await Promise.all(
      templateTasks.map((t, i) => {
        let status: "COMPLETE" | "IN_PROGRESS" | "UNDER_REVIEW" | "BLOCKED" | "NOT_STARTED" = "NOT_STARTED";
        let completedDate: Date | null = null;
        let completedById: string | null = null;
        let flagReason: string | null = null;
        const assignee = i < Math.min(templateTasks.length, 30) ? activeUsers[i % activeUsers.length] : null;

        if (i < completeCount) {
          status = "COMPLETE";
          completedDate = daysAgo(completeCount - i + 2);
          completedById = assignee?.id ?? sarah.id;
        } else if (i < completeCount + inProgressCount) {
          status = i % 3 === 0 ? "UNDER_REVIEW" : "IN_PROGRESS";
        } else if (i < completeCount + inProgressCount + blockedCount) {
          status = "BLOCKED";
          flagReason = blockReasons[i - completeCount - inProgressCount] ?? "Waiting on seller documentation.";
        }

        return prisma.task.create({
          data: {
            dealId,
            templateTaskId: createdTemplateTasks[i]?.id,
            title: t.title,
            workstream: t.workstream,
            section: t.section ?? null,
            phase,
            sortOrder: t.sortOrder,
            status,
            priority: i < 5 ? "HIGH" : i < 15 ? "MEDIUM" : pick(["MEDIUM", "LOW"]),
            assignedToId: assignee?.id ?? null,
            completedDate,
            completedById,
            flagReason,
            dueDate: daysFromNow(Math.floor(i * 1.5) + 5),
          },
        });
      })
    );
    return tasks;
  }

  // ─────────────────────────────────────────────
  // 5. DEALS — One at every stage + an empty template
  // ─────────────────────────────────────────────
  console.log("Creating deals…");

  // ── DEAL 1: Empty Template (Pipeline — no tasks) ──
  const emptyDeal = await prisma.deal.create({
    data: {
      orgId: org.id,
      name: "Lakeview Memory Care — New Lead",
      facilityName: "Lakeview Memory Care Center",
      facilityType: "ALF",
      state: "AZ",
      city: "Scottsdale",
      address: "8900 E Camelback Rd",
      zipCode: "85251",
      bedCount: 64,
      currentOwner: "Desert Bloom Senior Living LLC",
      purchasePrice: 4800000,
      status: "PIPELINE",
      regionId: southwest.id,
    },
  });
  await createChannels(emptyDeal.id);
  await prisma.activityLog.create({
    data: {
      dealId: emptyDeal.id,
      userId: owen.id,
      action: "DEAL_CREATED",
      entityType: "Deal",
      entityId: emptyDeal.id,
      newValue: { name: emptyDeal.name, status: "PIPELINE" },
      timestamp: daysAgo(2),
    },
  });

  // ── DEAL 2: Pipeline (early-stage, some tasks assigned) ──
  const pipelineDeal = await prisma.deal.create({
    data: {
      orgId: org.id,
      name: "Sunset Gardens SNF Acquisition",
      facilityName: "Sunset Gardens Skilled Nursing",
      facilityType: "SNF",
      state: "CA",
      city: "Sacramento",
      address: "2100 Sunset Blvd",
      zipCode: "95814",
      bedCount: 150,
      currentOwner: "Golden State Healthcare Partners",
      purchasePrice: 12000000,
      status: "PIPELINE",
      regionId: california.id,
      dealLeadId: maria.id,
      templateId: snfPreClose.id,
    },
  });
  const pipelineChannels = await createChannels(pipelineDeal.id);
  await createDealTasks(pipelineDeal.id, snfPreCloseTasks, createdSNFTasks, {
    completeCount: 0,
    inProgressCount: 3,
    blockedCount: 0,
  });

  // ── DEAL 3: LOI ──
  const loiDeal = await prisma.deal.create({
    data: {
      orgId: org.id,
      name: "Mountain View ALF Acquisition",
      facilityName: "Mountain View Assisted Living",
      facilityType: "ALF",
      state: "OR",
      city: "Portland",
      address: "789 Mountain View Blvd",
      zipCode: "97201",
      bedCount: 80,
      currentOwner: "Pacific Senior Care Inc",
      purchasePrice: 5200000,
      targetCloseDate: daysFromNow(90),
      status: "LOI",
      dealLeadId: sarah.id,
      regionId: pacificNW.id,
      templateId: alfPreClose.id,
    },
  });
  const loiChannels = await createChannels(loiDeal.id);
  const loiTasks = await createDealTasks(loiDeal.id, alfPreCloseTasks, createdALFTasks, {
    completeCount: 5,
    inProgressCount: 4,
    blockedCount: 1,
    blockReasons: ["Current owner has not provided dietary service records. Follow-up email sent."],
  });

  // ── DEAL 4: Due Diligence (heavy activity) ──
  const ddDeal = await prisma.deal.create({
    data: {
      orgId: org.id,
      name: "Cedar Ridge SNF Acquisition",
      facilityName: "Cedar Ridge Skilled Nursing Facility",
      facilityType: "SNF",
      state: "ID",
      city: "Boise",
      address: "4521 Cedar Ridge Dr",
      zipCode: "83702",
      bedCount: 120,
      currentOwner: "Clearwater Senior Living LLC",
      purchasePrice: 8500000,
      targetCloseDate: daysFromNow(45),
      status: "DUE_DILIGENCE",
      dealLeadId: sarah.id,
      regionId: idahoMontana.id,
      templateId: snfPreClose.id,
    },
  });
  const ddChannels = await createChannels(ddDeal.id);
  const ddTasks = await createDealTasks(ddDeal.id, snfPreCloseTasks, createdSNFTasks, {
    completeCount: 22,
    inProgressCount: 8,
    blockedCount: 2,
    blockReasons: [
      "Seller has not provided managed care contract details. Follow-up call scheduled for next Tuesday.",
      "Waiting on vendor to provide updated pricing. Current contract expired last month.",
    ],
  });

  // ── DEAL 5: CHOW Filed ──
  const chowDeal = await prisma.deal.create({
    data: {
      orgId: org.id,
      name: "Riverstone SNF Acquisition",
      facilityName: "Riverstone Skilled Nursing Facility",
      facilityType: "SNF",
      state: "WA",
      city: "Spokane",
      address: "1450 N Division St",
      zipCode: "99202",
      bedCount: 90,
      currentOwner: "Inland Empire Health Services",
      purchasePrice: 6200000,
      targetCloseDate: daysFromNow(30),
      status: "CHOW_FILED",
      dealLeadId: doug.id,
      regionId: pacificNW.id,
      templateId: snfPreClose.id,
    },
  });
  const chowChannels = await createChannels(chowDeal.id);
  const chowTasks = await createDealTasks(chowDeal.id, snfPreCloseTasks, createdSNFTasks, {
    completeCount: 35,
    inProgressCount: 5,
    blockedCount: 1,
    blockReasons: ["Awaiting state CHOW approval — estimated 2 more weeks."],
  });

  // ── DEAL 6: Closing ──
  const closingDeal = await prisma.deal.create({
    data: {
      orgId: org.id,
      name: "Pinecrest ALF Acquisition",
      facilityName: "Pinecrest Assisted Living",
      facilityType: "ALF",
      state: "OR",
      city: "Eugene",
      address: "3200 Hilyard St",
      zipCode: "97405",
      bedCount: 56,
      currentOwner: "Willamette Valley Senior Living",
      purchasePrice: 3900000,
      targetCloseDate: daysFromNow(7),
      status: "CLOSING",
      dealLeadId: maria.id,
      regionId: pacificNW.id,
      templateId: alfPreClose.id,
    },
  });
  const closingChannels = await createChannels(closingDeal.id);
  const closingTasks = await createDealTasks(closingDeal.id, alfPreCloseTasks, createdALFTasks, {
    completeCount: 18,
    inProgressCount: 2,
    blockedCount: 0,
  });

  // ── DEAL 7: Transition Day ──
  const tdDeal = await prisma.deal.create({
    data: {
      orgId: org.id,
      name: "Maple Grove SNF Acquisition",
      facilityName: "Maple Grove Skilled Nursing",
      facilityType: "SNF",
      state: "ID",
      city: "Twin Falls",
      address: "890 Blue Lakes Blvd",
      zipCode: "83301",
      bedCount: 100,
      currentOwner: "Magic Valley Healthcare LLC",
      purchasePrice: 7100000,
      targetCloseDate: daysAgo(1),
      actualCloseDate: daysAgo(1),
      status: "TRANSITION_DAY",
      dealLeadId: sarah.id,
      regionId: idahoMontana.id,
      templateId: snfPreClose.id,
      transitionDayStartedAt: hoursAgo(6),
    },
  });
  const tdChannels = await createChannels(tdDeal.id);
  // Pre-close tasks — all done
  await createDealTasks(tdDeal.id, snfPreCloseTasks, createdSNFTasks, {
    completeCount: 45,
    inProgressCount: 0,
    blockedCount: 0,
  });
  // Day-of tasks — in progress
  const tdDayOfTasks = await Promise.all(
    dayOfTaskDefs.map((t, i) => {
      let status: "COMPLETE" | "IN_PROGRESS" | "NOT_STARTED" = "NOT_STARTED";
      let completedDate: Date | null = null;
      let completedById: string | null = null;
      if (i < 10) {
        status = "COMPLETE";
        completedDate = hoursAgo(6 - Math.floor(i * 0.5));
        completedById = activeUsers[i % activeUsers.length].id;
      } else if (i < 16) {
        status = "IN_PROGRESS";
      }
      return prisma.task.create({
        data: {
          dealId: tdDeal.id,
          title: t.title,
          workstream: t.workstream,
          phase: "DAY_OF",
          sortOrder: t.sortOrder,
          status,
          priority: i < 6 ? "CRITICAL" : "HIGH",
          assignedToId: activeUsers[i % activeUsers.length].id,
          completedDate,
          completedById,
          dueDate: now,
        },
      });
    })
  );

  // ── DEAL 8: Week 1 ──
  const week1Deal = await prisma.deal.create({
    data: {
      orgId: org.id,
      name: "Valley View ILF Acquisition",
      facilityName: "Valley View Independent Living",
      facilityType: "ILF",
      state: "MT",
      city: "Missoula",
      address: "2700 Brooks St",
      zipCode: "59801",
      bedCount: 110,
      currentOwner: "Big Sky Senior Living Partners",
      purchasePrice: 9200000,
      targetCloseDate: daysAgo(5),
      actualCloseDate: daysAgo(5),
      status: "WEEK_1",
      dealLeadId: kevin.id,
      regionId: idahoMontana.id,
      templateId: snfPreClose.id,
      transitionDayStartedAt: daysAgo(5),
    },
  });
  const week1Channels = await createChannels(week1Deal.id);
  // All pre-close and day-of done
  await createDealTasks(week1Deal.id, snfPreCloseTasks, createdSNFTasks, {
    completeCount: 45,
    inProgressCount: 0,
    blockedCount: 0,
  });

  // ── DEAL 9: Post-Close ──
  const postCloseDeal = await prisma.deal.create({
    data: {
      orgId: org.id,
      name: "Cascade Heights SNF — Completed",
      facilityName: "Cascade Heights Skilled Nursing",
      facilityType: "SNF",
      state: "WA",
      city: "Seattle",
      address: "1200 Madison St",
      zipCode: "98104",
      bedCount: 130,
      currentOwner: "Cascadia Healthcare Group",
      purchasePrice: 11500000,
      targetCloseDate: daysAgo(30),
      actualCloseDate: daysAgo(28),
      status: "POST_CLOSE",
      dealLeadId: doug.id,
      regionId: pacificNW.id,
      templateId: snfPreClose.id,
      transitionDayStartedAt: daysAgo(28),
    },
  });
  const postCloseChannels = await createChannels(postCloseDeal.id);
  await createDealTasks(postCloseDeal.id, snfPreCloseTasks, createdSNFTasks, {
    completeCount: 45,
    inProgressCount: 0,
    blockedCount: 0,
  });

  // ─────────────────────────────────────────────
  // 6. DUE DILIGENCE DOCUMENTS (Cedar Ridge)
  // ─────────────────────────────────────────────
  console.log("Creating due diligence documents…");
  const ddDocs = [
    { documentName: "Last 3 Years Audited Financial Statements", category: "Financial", status: "RECEIVED", receivedDate: daysAgo(15) },
    { documentName: "Tax Returns (3 years)", category: "Financial", status: "RECEIVED", receivedDate: daysAgo(12) },
    { documentName: "Current Accounts Receivable Aging", category: "Financial", status: "RECEIVED", receivedDate: daysAgo(10) },
    { documentName: "Medicare/Medicaid Cost Reports (3 years)", category: "Financial", status: "REQUESTED", requestedDate: daysAgo(20) },
    { documentName: "Managed Care Contract Portfolio", category: "Financial", status: "REQUESTED", requestedDate: daysAgo(18) },
    { documentName: "State Survey Reports (last 3 cycles)", category: "Regulatory", status: "RECEIVED", receivedDate: daysAgo(18) },
    { documentName: "Plans of Correction", category: "Regulatory", status: "RECEIVED", receivedDate: daysAgo(16) },
    { documentName: "Current Facility License", category: "Regulatory", status: "RECEIVED", receivedDate: daysAgo(20) },
    { documentName: "Fire Marshal Inspection Report", category: "Regulatory", status: "RECEIVED", receivedDate: daysAgo(14) },
    { documentName: "Employee Roster with Certifications", category: "HR", status: "RECEIVED", receivedDate: daysAgo(8) },
    { documentName: "Workers Compensation Claims History", category: "HR", status: "REQUESTED", requestedDate: daysAgo(10) },
    { documentName: "Employee Benefit Program Summary", category: "HR", status: "RECEIVED", receivedDate: daysAgo(7) },
    { documentName: "Phase 1 Environmental Report", category: "Physical Plant", status: "RECEIVED", receivedDate: daysAgo(22) },
    { documentName: "HVAC Maintenance Records", category: "Physical Plant", status: "NOT_REQUESTED" },
    { documentName: "Roof Inspection Report", category: "Physical Plant", status: "RECEIVED", receivedDate: daysAgo(11) },
    { documentName: "Title Commitment", category: "Legal", status: "RECEIVED", receivedDate: daysAgo(19) },
    { documentName: "Zoning Verification", category: "Legal", status: "RECEIVED", receivedDate: daysAgo(17) },
    { documentName: "Property Survey", category: "Legal", status: "REQUESTED", requestedDate: daysAgo(5) },
    { documentName: "EHR System Contract", category: "IT", status: "RECEIVED", receivedDate: daysAgo(6) },
    { documentName: "Pharmacy Services Agreement", category: "Clinical", status: "RECEIVED", receivedDate: daysAgo(9) },
  ];

  for (const [i, doc] of ddDocs.entries()) {
    await prisma.dueDiligenceDoc.create({
      data: {
        dealId: ddDeal.id,
        documentName: doc.documentName,
        category: doc.category,
        status: doc.status,
        requestedDate: doc.requestedDate ?? (doc.status !== "NOT_REQUESTED" ? daysAgo(20) : null),
        receivedDate: doc.receivedDate ?? null,
        sortOrder: i,
      },
    });
  }

  // ─────────────────────────────────────────────
  // 7. CHAT MESSAGES (across multiple deals)
  // ─────────────────────────────────────────────
  console.log("Creating chat messages…");

  // Cedar Ridge (Due Diligence — most active)
  await prisma.chatMessage.createMany({
    data: [
      { channelId: ddChannels.general.id, userId: sarah.id, body: "Team, Cedar Ridge due diligence is officially kicked off. Let's target completing all clinical tasks within the first two weeks.", createdAt: daysAgo(20) },
      { channelId: ddChannels.general.id, userId: owen.id, body: "Great. I'll be on-site next Wednesday for the walk-through. Tim, can you join?", createdAt: daysAgo(19) },
      { channelId: ddChannels.general.id, userId: tim.id, body: "Confirmed. I'll drive up Tuesday evening. Want me to bring the inspection checklist?", createdAt: daysAgo(19) },
      { channelId: ddChannels.general.id, userId: sarah.id, body: "Yes please. Also bring the camera — we need to document the east wing HVAC situation.", createdAt: daysAgo(19) },
      { channelId: ddChannels.general.id, userId: owen.id, body: "Walk-through complete. Building is solid overall. Full notes uploaded to the facilities channel.", createdAt: daysAgo(12) },
      { channelId: ddChannels.general.id, userId: rachel.id, body: "Just got word from the seller — they'll have the managed care contracts to us by Friday.", createdAt: daysAgo(5) },
      { channelId: ddChannels.general.id, userId: doug.id, body: "Idaho CHOW paperwork is ready to file. Just waiting on the final LOI countersignature.", createdAt: daysAgo(3) },
      { channelId: ddChannels.general.id, userId: sarah.id, body: "LOI is countersigned. Doug, please file the CHOW today.", createdAt: daysAgo(2) },
      { channelId: ddChannels.clinical.id, userId: sarah.id, body: "The current staffing ratios look tight. We may need to budget for 3 additional CNAs post-acquisition.", createdAt: daysAgo(18) },
      { channelId: ddChannels.clinical.id, userId: tim.id, body: "I reviewed their infection control program. It's solid but the documentation needs updating to match our standards.", createdAt: daysAgo(16) },
      { channelId: ddChannels.clinical.id, userId: kevin.id, body: "Pharmacy consultant contract expires in 60 days. We should start sourcing alternatives now.", createdAt: daysAgo(14) },
      { channelId: ddChannels.clinical.id, userId: rachel.id, body: "Dietary program review complete. They use an outside vendor — contract is favorable, recommend keeping it.", createdAt: daysAgo(10) },
      { channelId: ddChannels.regulatory.id, userId: doug.id, body: "Idaho CHOW application is straightforward. I've pulled the forms. Processing time is ~90 days.", createdAt: daysAgo(15) },
      { channelId: ddChannels.regulatory.id, userId: doug.id, body: "CHOW application filed with Idaho DHW today. Confirmation number: IDH-2026-04521.", createdAt: daysAgo(2) },
      { channelId: ddChannels.facilities.id, userId: james.id, body: "HVAC units on the east wing are original to the building (2003). We should budget $180K for replacement within 18 months.", createdAt: daysAgo(11) },
      { channelId: ddChannels.facilities.id, userId: james.id, body: "Roof inspection came back clean. Warranty good through 2029.", createdAt: daysAgo(8) },
      { channelId: ddChannels.facilities.id, userId: tim.id, body: "Fire panel tested all zones — passed. Sprinkler system last serviced 6 months ago.", createdAt: daysAgo(6) },
      { channelId: ddChannels.financial.id, userId: steve.id, body: "Initial financial review looks promising. EBITDA margins are above market average at 18.2%.", createdAt: daysAgo(17) },
      { channelId: ddChannels.financial.id, userId: steve.id, body: "Payer mix breakdown: Medicare Part A 35%, Medicaid 42%, Managed Care 15%, Private Pay 8%. Strong Medicare mix.", createdAt: daysAgo(14) },
      { channelId: ddChannels.financial.id, userId: maria.id, body: "Vendor contracts reviewed. Most are month-to-month which gives us flexibility post-close.", createdAt: daysAgo(7) },
    ],
  });

  // Mountain View (LOI)
  await prisma.chatMessage.createMany({
    data: [
      { channelId: loiChannels.general.id, userId: sarah.id, body: "LOI has been accepted. We have 90 days for due diligence.", createdAt: daysAgo(10) },
      { channelId: loiChannels.general.id, userId: doug.id, body: "Oregon CHOW process is more involved than Idaho. I'll start pulling forms now.", createdAt: daysAgo(9) },
      { channelId: loiChannels.general.id, userId: tim.id, body: "I can be on-site for the initial walkthrough next Thursday.", createdAt: daysAgo(8) },
      { channelId: loiChannels.clinical.id, userId: sarah.id, body: "This is an ALF — focus will be on care service levels and medication management, not skilled nursing.", createdAt: daysAgo(7) },
      { channelId: loiChannels.financial.id, userId: steve.id, body: "Private-pay rates are below market by about 12%. Opportunity to increase post-acquisition.", createdAt: daysAgo(5) },
    ],
  });

  // Riverstone (CHOW Filed)
  await prisma.chatMessage.createMany({
    data: [
      { channelId: chowChannels.general.id, userId: doug.id, body: "WA CHOW filed. Background checks submitted for all principals. Estimated 60-day turnaround.", createdAt: daysAgo(25) },
      { channelId: chowChannels.general.id, userId: doug.id, body: "Got a call from WA DOH — they need the surety bond documentation by end of week.", createdAt: daysAgo(10) },
      { channelId: chowChannels.general.id, userId: steve.id, body: "Surety bond is secured. $25K with Pacific Surety. Documentation sent to WA DOH this morning.", createdAt: daysAgo(9) },
      { channelId: chowChannels.regulatory.id, userId: doug.id, body: "WA requires Certificate of Need review as part of the CHOW. Filing today.", createdAt: daysAgo(20) },
      { channelId: chowChannels.facilities.id, userId: kevin.id, body: "Building is in excellent condition. Built 2015, well-maintained. Minor cosmetic updates only.", createdAt: daysAgo(15) },
    ],
  });

  // Transition Day deal
  await prisma.chatMessage.createMany({
    data: [
      { channelId: tdChannels.general.id, userId: sarah.id, body: "TRANSITION DAY IS GO. Team is on-site. All pre-close items verified complete.", createdAt: hoursAgo(6) },
      { channelId: tdChannels.general.id, userId: tim.id, body: "Keys collected. Safe combo changed. All exterior doors photographed.", createdAt: hoursAgo(5) },
      { channelId: tdChannels.general.id, userId: rachel.id, body: "Narcotics count verified with outgoing DNS — all clear. Photos uploaded.", createdAt: hoursAgo(4) },
      { channelId: tdChannels.general.id, userId: james.id, body: "Phone system transfer complete. Internet verified. Working on fire panel now.", createdAt: hoursAgo(3) },
      { channelId: tdChannels.general.id, userId: sarah.id, body: "Great progress team! We're about 60% through the checklist. Keep pushing.", createdAt: hoursAgo(2) },
      { channelId: tdChannels.clinical.id, userId: rachel.id, body: "Resident census verified — 87 current residents, 13 vacant beds. All care plans reviewed.", createdAt: hoursAgo(4) },
      { channelId: tdChannels.facilities.id, userId: james.id, body: "Fire panel tested all zones — PASS. Nurse call system tested 3 wings — all responding.", createdAt: hoursAgo(2) },
    ],
  });

  // ─────────────────────────────────────────────
  // 8. FEED POSTS
  // ─────────────────────────────────────────────
  console.log("Creating feed posts…");

  // Cedar Ridge feed
  await prisma.feedPost.createMany({
    data: [
      { dealId: ddDeal.id, userId: owen.id, postType: "SYSTEM_EVENT", body: "Deal created: Cedar Ridge SNF Acquisition", metadata: { action: "DEAL_CREATED" }, createdAt: daysAgo(35) },
      { dealId: ddDeal.id, userId: owen.id, postType: "SYSTEM_EVENT", body: "Deal status changed from Pipeline to LOI", metadata: { action: "DEAL_STATUS_CHANGED", from: "PIPELINE", to: "LOI" }, createdAt: daysAgo(30) },
      { dealId: ddDeal.id, userId: sarah.id, postType: "MESSAGE", body: "Initial financial review looks promising. EBITDA margins are above market average at 18.2%. Payer mix is favorable with 35% Medicare Part A.", createdAt: daysAgo(25) },
      { dealId: ddDeal.id, userId: owen.id, postType: "SYSTEM_EVENT", body: "Deal status changed from LOI to Due Diligence", metadata: { action: "DEAL_STATUS_CHANGED", from: "LOI", to: "DUE_DILIGENCE" }, createdAt: daysAgo(20) },
      { dealId: ddDeal.id, userId: tim.id, postType: "TASK_COMPLETE", body: "Completed: Conduct building walk-through inspection", taskId: ddTasks[26]?.id, createdAt: daysAgo(12) },
      { dealId: ddDeal.id, userId: sarah.id, postType: "TASK_FLAGGED", body: "Blocked: Analyze managed care contracts — Seller has not provided details", taskId: ddTasks[21]?.id, createdAt: daysAgo(8) },
      { dealId: ddDeal.id, userId: james.id, postType: "MESSAGE", body: "Completed facility walk-through. Building is in good condition overall. East wing HVAC needs attention — budget $180K for replacement.", createdAt: daysAgo(11) },
      { dealId: ddDeal.id, userId: doug.id, postType: "MESSAGE", body: "Idaho CHOW application filed. Confirmation: IDH-2026-04521. Expected processing: 90 days.", createdAt: daysAgo(2) },
      { dealId: ddDeal.id, userId: steve.id, postType: "MESSAGE", body: "Financial model updated with latest payer mix data. Purchase price is well within our target IRR of 18%+.", createdAt: daysAgo(1) },
    ],
  });

  // Transition Day feed
  await prisma.feedPost.createMany({
    data: [
      { dealId: tdDeal.id, userId: owen.id, postType: "SYSTEM_EVENT", body: "Transition Day started for Maple Grove SNF", metadata: { action: "TRANSITION_DAY_STARTED" }, createdAt: hoursAgo(6) },
      { dealId: tdDeal.id, userId: tim.id, postType: "TASK_COMPLETE", body: "Completed: Collect all keys from seller", createdAt: hoursAgo(5) },
      { dealId: tdDeal.id, userId: rachel.id, postType: "TASK_COMPLETE", body: "Completed: Verify narcotics count with outgoing DNS", createdAt: hoursAgo(4) },
      { dealId: tdDeal.id, userId: sarah.id, postType: "MESSAGE", body: "On track — 60% through the transition day checklist. All critical items verified.", createdAt: hoursAgo(2) },
    ],
  });

  // Closing deal feed
  await prisma.feedPost.createMany({
    data: [
      { dealId: closingDeal.id, userId: owen.id, postType: "SYSTEM_EVENT", body: "Deal created: Pinecrest ALF Acquisition", metadata: { action: "DEAL_CREATED" }, createdAt: daysAgo(60) },
      { dealId: closingDeal.id, userId: maria.id, postType: "MESSAGE", body: "All pre-close items substantially complete. Moving to closing.", createdAt: daysAgo(8) },
      { dealId: closingDeal.id, userId: owen.id, postType: "SYSTEM_EVENT", body: "Deal status changed to Closing", metadata: { action: "DEAL_STATUS_CHANGED", from: "CHOW_FILED", to: "CLOSING" }, createdAt: daysAgo(7) },
    ],
  });

  // ─────────────────────────────────────────────
  // 9. BUILDING ASSIGNMENTS
  // ─────────────────────────────────────────────
  console.log("Creating building assignments…");

  // Cedar Ridge
  for (const { user, role } of [
    { user: owen, role: "BUILDING_LEAD" as const },
    { user: sarah, role: "BUILDING_LEAD" as const },
    { user: tim, role: "TEAM_MEMBER" as const },
    { user: james, role: "TEAM_MEMBER" as const },
    { user: rachel, role: "TEAM_MEMBER" as const },
  ]) {
    await prisma.buildingAssignment.create({
      data: { dealId: ddDeal.id, userId: user.id, onSiteRole: role, assignedById: owen.id },
    });
  }

  // Maple Grove (Transition Day)
  for (const { user, role } of [
    { user: sarah, role: "BUILDING_LEAD" as const },
    { user: tim, role: "TEAM_MEMBER" as const },
    { user: rachel, role: "TEAM_MEMBER" as const },
    { user: james, role: "TEAM_MEMBER" as const },
  ]) {
    await prisma.buildingAssignment.create({
      data: { dealId: tdDeal.id, userId: user.id, onSiteRole: role, assignedById: owen.id },
    });
  }

  // Riverstone (CHOW)
  for (const { user, role } of [
    { user: doug, role: "BUILDING_LEAD" as const },
    { user: kevin, role: "TEAM_MEMBER" as const },
  ]) {
    await prisma.buildingAssignment.create({
      data: { dealId: chowDeal.id, userId: user.id, onSiteRole: role, assignedById: owen.id },
    });
  }

  // Pinecrest (Closing)
  for (const { user, role } of [
    { user: maria, role: "BUILDING_LEAD" as const },
    { user: tim, role: "TEAM_MEMBER" as const },
  ]) {
    await prisma.buildingAssignment.create({
      data: { dealId: closingDeal.id, userId: user.id, onSiteRole: role, assignedById: owen.id },
    });
  }

  // Mountain View (LOI)
  await prisma.buildingAssignment.create({
    data: { dealId: loiDeal.id, userId: sarah.id, onSiteRole: "BUILDING_LEAD", assignedById: owen.id },
  });

  // ─────────────────────────────────────────────
  // 10. ACTIVITY LOGS (Cedar Ridge — rich history)
  // ─────────────────────────────────────────────
  console.log("Creating activity logs…");

  const ddActivityData = [
    { action: "DEAL_CREATED" as const, entityType: "Deal", entityId: ddDeal.id, userId: owen.id, newValue: { name: ddDeal.name, status: "PIPELINE" }, timestamp: daysAgo(35) },
    { action: "DEAL_STATUS_CHANGED" as const, entityType: "Deal", entityId: ddDeal.id, userId: owen.id, oldValue: { status: "PIPELINE" }, newValue: { status: "LOI" }, timestamp: daysAgo(30) },
    { action: "DEAL_STATUS_CHANGED" as const, entityType: "Deal", entityId: ddDeal.id, userId: owen.id, oldValue: { status: "LOI" }, newValue: { status: "DUE_DILIGENCE" }, timestamp: daysAgo(20) },
    { action: "USER_ASSIGNED_TO_BUILDING" as const, entityType: "BuildingAssignment", userId: owen.id, newValue: { user: "Sarah Chen", role: "BUILDING_LEAD" }, timestamp: daysAgo(20) },
    { action: "TASK_COMPLETED" as const, entityType: "Task", entityId: ddTasks[0]?.id, userId: owen.id, newValue: { task: ddTasks[0]?.title }, timestamp: daysAgo(18) },
    { action: "TASK_COMPLETED" as const, entityType: "Task", entityId: ddTasks[5]?.id, userId: sarah.id, newValue: { task: ddTasks[5]?.title }, timestamp: daysAgo(15) },
    { action: "TASK_FLAGGED" as const, entityType: "Task", entityId: ddTasks[22]?.id, userId: sarah.id, newValue: { task: ddTasks[22]?.title, reason: "Seller has not provided managed care contract details" }, timestamp: daysAgo(8) },
    { action: "FILE_UPLOADED" as const, entityType: "TaskFile", userId: james.id, newValue: { fileName: "east_wing_hvac_photos.zip" }, timestamp: daysAgo(11) },
    { action: "COMMENT_ADDED" as const, entityType: "Task", entityId: ddTasks[11]?.id, userId: doug.id, newValue: { comment: "CHOW application filed with Idaho DHW" }, timestamp: daysAgo(2) },
  ];

  await prisma.activityLog.createMany({
    data: ddActivityData.map((a) => ({
      dealId: ddDeal.id,
      userId: a.userId,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId ?? null,
      oldValue: (a as any).oldValue ?? null,
      newValue: a.newValue,
      timestamp: a.timestamp,
    })),
  });

  // Transition Day activity
  await prisma.activityLog.createMany({
    data: [
      { dealId: tdDeal.id, userId: owen.id, action: "DEAL_CREATED" as const, entityType: "Deal", entityId: tdDeal.id, newValue: { name: tdDeal.name }, timestamp: daysAgo(90) },
      { dealId: tdDeal.id, userId: owen.id, action: "TRANSITION_DAY_STARTED" as const, entityType: "Deal", entityId: tdDeal.id, newValue: { startedAt: hoursAgo(6).toISOString() }, timestamp: hoursAgo(6) },
      { dealId: tdDeal.id, userId: tim.id, action: "TASK_COMPLETED" as const, entityType: "Task", entityId: tdDayOfTasks[0]?.id, newValue: { task: "Collect all keys from seller" }, timestamp: hoursAgo(5) },
      { dealId: tdDeal.id, userId: rachel.id, action: "TASK_COMPLETED" as const, entityType: "Task", entityId: tdDayOfTasks[5]?.id, newValue: { task: "Verify narcotics count with outgoing DNS" }, timestamp: hoursAgo(4) },
    ],
  });

  // Other deals — basic activity
  for (const deal of [loiDeal, chowDeal, closingDeal, week1Deal, postCloseDeal, pipelineDeal]) {
    await prisma.activityLog.create({
      data: {
        dealId: deal.id,
        userId: owen.id,
        action: "DEAL_CREATED",
        entityType: "Deal",
        entityId: deal.id,
        newValue: { name: deal.name, status: deal.status },
        timestamp: daysAgo(Math.floor(Math.random() * 60) + 10),
      },
    });
  }

  // ─────────────────────────────────────────────
  // 11. TASK COMMENTS (Cedar Ridge)
  // ─────────────────────────────────────────────
  console.log("Creating task comments…");

  if (ddTasks[0]) {
    await prisma.taskComment.createMany({
      data: [
        { taskId: ddTasks[0].id, userId: sarah.id, body: "Current staffing: 8 RNs, 12 LVNs, 24 CNAs. Need to verify night shift coverage.", createdAt: daysAgo(17) },
        { taskId: ddTasks[0].id, userId: tim.id, body: "Night shift is running 1 RN, 2 LVN, 4 CNA. Below our standard but meets state minimum.", createdAt: daysAgo(16) },
        { taskId: ddTasks[0].id, userId: sarah.id, body: "We'll need to add 1 RN and 2 CNAs on nights post-acquisition. Added to staffing budget.", createdAt: daysAgo(15) },
      ],
    });
  }

  if (ddTasks[6]) {
    await prisma.taskComment.createMany({
      data: [
        { taskId: ddTasks[6].id, userId: rachel.id, body: "Narcotics storage is a double-locked cabinet in the med room. Count procedures are documented and current.", createdAt: daysAgo(13) },
        { taskId: ddTasks[6].id, userId: sarah.id, body: "Good. Make sure we get photos of the storage setup for our records.", createdAt: daysAgo(12) },
      ],
    });
  }

  if (ddTasks[26]) {
    await prisma.taskComment.createMany({
      data: [
        { taskId: ddTasks[26].id, userId: james.id, body: "Walk-through notes: Building is 2003 construction, well-maintained overall. East wing HVAC is original and showing age.", createdAt: daysAgo(11) },
        { taskId: ddTasks[26].id, userId: james.id, body: "Kitchen equipment in good condition. Generator tested and operational. Parking lot needs resealing.", createdAt: daysAgo(11) },
        { taskId: ddTasks[26].id, userId: owen.id, body: "Thanks James. Please get quotes for the HVAC replacement and parking lot resealing.", createdAt: daysAgo(10) },
      ],
    });
  }

  // ─────────────────────────────────────────────
  // 12. STATE REQUIREMENTS (8 states)
  // ─────────────────────────────────────────────
  console.log("Creating state requirements…");

  const stateReqs = [
    {
      stateCode: "ID", facilityType: "SNF" as const,
      licensingBody: "Idaho Department of Health & Welfare",
      licensingBodyUrl: "https://healthandwelfare.idaho.gov",
      suretyBondRequired: true, suretyBondAmount: 50000, conRequired: false,
      backgroundCheckRequired: true, processingTimelineDays: 90,
      requirementsChecklist: {
        items: ["Completed CHOW application", "Administrator license verification", "Surety bond ($50,000)", "Background check results", "Fire inspection certificate", "Financial statements (3 years)"],
      },
    },
    {
      stateCode: "OR", facilityType: "SNF" as const,
      licensingBody: "Oregon Health Authority",
      licensingBodyUrl: "https://www.oregon.gov/oha",
      suretyBondRequired: false, conRequired: true,
      backgroundCheckRequired: true, processingTimelineDays: 120,
      requirementsChecklist: {
        items: ["Completed CHOW application", "Certificate of Need application", "Administrator license verification", "Background check results", "Financial review documentation", "Staffing plan"],
      },
    },
    {
      stateCode: "OR", facilityType: "ALF" as const,
      licensingBody: "Oregon Health Authority — Long Term Care Licensing",
      licensingBodyUrl: "https://www.oregon.gov/oha",
      suretyBondRequired: false, conRequired: false,
      backgroundCheckRequired: true, processingTimelineDays: 90,
      requirementsChecklist: {
        items: ["CHOW application", "Administrator certification", "Background checks (all staff)", "Financial viability documentation", "Emergency preparedness plan"],
      },
    },
    {
      stateCode: "WA", facilityType: "SNF" as const,
      licensingBody: "Washington State Department of Health",
      licensingBodyUrl: "https://www.doh.wa.gov",
      suretyBondRequired: true, suretyBondAmount: 25000, conRequired: true,
      backgroundCheckRequired: true, processingTimelineDays: 90,
      requirementsChecklist: {
        items: ["Completed CHOW application", "Certificate of Need review", "Surety bond ($25,000)", "Background check results", "Administrator credentials", "Financial feasibility study"],
      },
    },
    {
      stateCode: "CA", facilityType: "SNF" as const,
      licensingBody: "California Department of Public Health",
      licensingBodyUrl: "https://www.cdph.ca.gov",
      suretyBondRequired: false, conRequired: true,
      backgroundCheckRequired: true, processingTimelineDays: 180,
      requirementsChecklist: {
        items: ["Completed CHOW application", "Certificate of Need application", "Administrator license verification", "DOJ/FBI background checks", "Financial statements (5 years)", "Staffing plan and ratios", "Quality assurance plan", "Emergency preparedness plan"],
      },
    },
    {
      stateCode: "MT", facilityType: "SNF" as const,
      licensingBody: "Montana Department of Public Health and Human Services",
      licensingBodyUrl: "https://dphhs.mt.gov",
      suretyBondRequired: false, conRequired: false,
      backgroundCheckRequired: true, processingTimelineDays: 60,
      requirementsChecklist: {
        items: ["CHOW application", "Administrator license", "Background check results", "Financial documentation", "Fire safety inspection"],
      },
    },
    {
      stateCode: "AZ", facilityType: "ALF" as const,
      licensingBody: "Arizona Department of Health Services",
      licensingBodyUrl: "https://www.azdhs.gov",
      suretyBondRequired: false, conRequired: false,
      backgroundCheckRequired: true, processingTimelineDays: 45,
      requirementsChecklist: {
        items: ["Change of ownership application", "Manager qualifications", "Background check results", "Facility inspection", "Financial viability documentation"],
      },
    },
    {
      stateCode: "NV", facilityType: "SNF" as const,
      licensingBody: "Nevada Division of Public and Behavioral Health",
      licensingBodyUrl: "https://dpbh.nv.gov",
      suretyBondRequired: true, suretyBondAmount: 30000, conRequired: false,
      backgroundCheckRequired: true, processingTimelineDays: 75,
      requirementsChecklist: {
        items: ["CHOW application", "Surety bond ($30,000)", "Administrator credentials", "Background checks", "Financial review", "Staffing plan"],
      },
    },
  ];

  for (const req of stateReqs) {
    await prisma.stateRequirement.create({
      data: {
        orgId: org.id,
        stateCode: req.stateCode,
        facilityType: req.facilityType,
        licensingBody: req.licensingBody,
        licensingBodyUrl: req.licensingBodyUrl,
        suretyBondRequired: req.suretyBondRequired,
        suretyBondAmount: req.suretyBondAmount ?? null,
        conRequired: req.conRequired,
        backgroundCheckRequired: req.backgroundCheckRequired,
        processingTimelineDays: req.processingTimelineDays,
        requirementsChecklist: req.requirementsChecklist,
      },
    });
  }

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log("\n━━━ Seed Complete ━━━");
  console.log(`Organization:     ${org.name}`);
  console.log(`Users:            ${allUsers.length}`);
  console.log(`Regions:          4`);
  console.log(`Templates:        4 (SNF Pre-Close, ALF Pre-Close, SNF Day-Of, ALF Day-Of)`);
  console.log(`Deals:            9`);
  console.log(`  ├─ Empty Template: Lakeview Memory Care (Pipeline, no tasks)`);
  console.log(`  ├─ Pipeline:       Sunset Gardens SNF`);
  console.log(`  ├─ LOI:            Mountain View ALF`);
  console.log(`  ├─ Due Diligence:  Cedar Ridge SNF (heavy activity)`);
  console.log(`  ├─ CHOW Filed:     Riverstone SNF`);
  console.log(`  ├─ Closing:        Pinecrest ALF`);
  console.log(`  ├─ Transition Day: Maple Grove SNF (live)`);
  console.log(`  ├─ Week 1:         Valley View ILF`);
  console.log(`  └─ Post-Close:     Cascade Heights SNF`);
  console.log(`State Reqs:       ${stateReqs.length} (ID, OR×2, WA, CA, MT, AZ, NV)`);
  console.log(`DD Docs:          ${ddDocs.length} (Cedar Ridge)`);
  console.log("");
  console.log("God mode login: owen / jockibox26");
  console.log("Team login:     any team email / password123");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
