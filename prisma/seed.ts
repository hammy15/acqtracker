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
  console.log("Seeding Acquisition Checklist database…\n");

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
  // 12. OTA DOCUMENTS & ANALYSIS
  // ─────────────────────────────────────────────
  console.log("Creating OTA documents & analysis…");

  // ── Cedar Ridge SNF (Due Diligence) — Full OTA with complete analysis ──
  const otaCedarRidge = await prisma.otaDocument.create({
    data: {
      dealId: ddDeal.id,
      fileName: "Cedar_Ridge_OTA_Final_Draft.pdf",
      filePath: "/uploads/ota/cedar-ridge-ota-final.pdf",
      fileSize: 2_450_000,
      fileType: "application/pdf",
      uploadedById: sarah.id,
      status: "COMPLETE",
      extractedText: "OPERATIONS TRANSFER AGREEMENT between Clearwater Senior Living LLC (Seller) and Cascadia Healthcare Group (Buyer) for Cedar Ridge Skilled Nursing Facility, Boise, Idaho...",
      createdAt: daysAgo(14),
      updatedAt: daysAgo(14),
    },
  });

  await prisma.otaAnalysis.create({
    data: {
      otaDocumentId: otaCedarRidge.id,
      summary: "• 120-bed SNF transfer with 87 current residents; seller retains liability for pre-close incidents\n• Staffing transition plan requires 90% employee retention for 120 days post-close\n• Medicare/Medicaid provider agreements transfer automatically; managed care contracts require re-credentialing\n• Buyer assumes all vendor contracts except therapy (expires 30 days post-close)\n• $850K escrow holdback for 12 months covering indemnification claims",
      sections: {
        staffing: [
          { title: "Employee Retention Mandate", detail: "Buyer must offer employment to at least 90% of current staff at comparable compensation for minimum 120 days." },
          { title: "Administrator Transition", detail: "Current administrator agrees to 60-day consulting period post-close at $150/hour." },
          { title: "Agency Staff Phase-Out", detail: "Seller currently using 4 agency CNAs; buyer plans to convert to permanent hires within 45 days." },
          { title: "Nursing Leadership", detail: "DNS position must be filled within 14 days of close; interim coverage arranged through staffing agreement." },
        ],
        financial: [
          { title: "Purchase Price Allocation", detail: "Total consideration of $8.5M: $6.2M real property, $1.8M operations/goodwill, $500K equipment and inventory." },
          { title: "Escrow Holdback", detail: "$850K held in escrow for 12 months to cover indemnification claims, regulatory penalties, and undisclosed liabilities." },
          { title: "Working Capital Adjustment", detail: "Final working capital target of $340K; adjustment settled within 90 days post-close based on audited figures." },
          { title: "Accounts Receivable", detail: "Buyer purchases AR over 60 days at 65% of face value; seller retains AR over 120 days." },
        ],
        regulatory: [
          { title: "Idaho CHOW Application", detail: "Filed with Idaho DHW; expected 90-day processing. Confirmation #IDH-2026-04521." },
          { title: "Medicare Provider Number", detail: "Automatic transfer under 42 CFR §489.18; CMS notification submitted with CHOW filing." },
          { title: "Medicaid Rate Continuity", detail: "Current Medicaid per diem of $215.40 transfers to buyer; next rate adjustment July 1." },
          { title: "Fire & Life Safety", detail: "Current fire marshal certificate valid through August 2026; no outstanding citations." },
        ],
        operations: [
          { title: "Resident Census", detail: "87 of 120 beds occupied (72.5%). Payer mix: 42 Medicaid, 30 Medicare Part A, 10 Managed Care, 5 Private Pay." },
          { title: "Vendor Contract Assignments", detail: "15 vendor contracts assigned to buyer at close; 3 require consent (pharmacy, therapy, dietary)." },
          { title: "EHR System", detail: "PointClickCare license transfers; buyer responsible for data migration within 180 days if switching systems." },
          { title: "Dietary Services", detail: "Morrison Healthcare contract assigned; favorable terms through December 2027." },
        ],
        timeline: [
          { title: "Pre-Close Period", detail: "45 days from execution for due diligence, CHOW filing, and financing conditions." },
          { title: "Transition Day", detail: "Detailed transition checklist required; seller provides 4 staff members for handoff support on day-of." },
          { title: "Post-Close Integration", detail: "120-day integration period with monthly check-ins between buyer and seller representatives." },
          { title: "Escrow Release", detail: "Escrow released in two tranches: 50% at 6 months, remaining 50% at 12 months pending no claims." },
        ],
        legal: [
          { title: "Indemnification", detail: "Seller indemnifies buyer for pre-close liabilities, regulatory penalties, and pending litigation (2 minor slip-and-fall claims)." },
          { title: "Non-Compete", detail: "Seller agrees to 3-year, 50-mile non-compete for skilled nursing operations." },
          { title: "Representations & Warranties", detail: "Standard reps survive 18 months post-close; fundamental reps (title, authority, taxes) survive 36 months." },
          { title: "Dispute Resolution", detail: "Binding arbitration in Ada County, Idaho under AAA Commercial Rules; prevailing party recovers attorney fees." },
        ],
      },
      risks: [
        { title: "Staffing Retention Risk", severity: "high", description: "90% retention mandate may be difficult given current labor market; 4 CNA positions already filled by agency staff.", recommendation: "Begin recruitment for permanent CNA positions immediately; offer retention bonuses to key clinical staff." },
        { title: "Managed Care Re-credentialing Gap", severity: "medium", description: "3 managed care contracts require re-credentialing which takes 60-90 days; potential revenue gap of $45K/month.", recommendation: "File re-credentialing applications before close date; negotiate bridge payment terms with payers." },
        { title: "HVAC Capital Expenditure", severity: "medium", description: "East wing HVAC units are original (2003) and will need replacement within 18 months; estimated $180K.", recommendation: "Negotiate seller credit or escrow reduction; include in Year 1 capital budget." },
        { title: "Pending Litigation", severity: "low", description: "Two pre-close slip-and-fall claims totaling approximately $75K; fully indemnified by seller.", recommendation: "Monitor claims through resolution; ensure escrow covers potential exposure." },
      ],
      compliance: [
        { regulation: "42 CFR §483 — Federal SNF Requirements", concern: "Current staffing ratios meet minimum but fall below recommended levels for night shift", severity: "medium" },
        { regulation: "Idaho Admin Code 16.03.02 — Skilled Nursing Facilities", concern: "Administrator license transfer must be completed within 30 days of ownership change", severity: "low" },
        { regulation: "HIPAA / HITECH — Patient Data Transfer", concern: "EHR data migration plan needed; 180-day window for system transition", severity: "low" },
        { regulation: "CMS Conditions of Participation", concern: "Quality metrics must be maintained during transition; current 3-star rating at risk if staffing drops", severity: "high" },
      ],
      agreedVsOpen: {
        agreed: [
          { item: "Purchase Price", detail: "$8.5M total consideration with allocation schedule", reference: "Section 2.1" },
          { item: "Employee Retention", detail: "90% retention at comparable compensation for 120 days", reference: "Section 7.3" },
          { item: "Escrow Terms", detail: "$850K holdback for 12 months in two-tranche release", reference: "Section 3.4" },
          { item: "Non-Compete", detail: "3-year, 50-mile radius for skilled nursing operations", reference: "Section 9.2" },
          { item: "Indemnification Cap", detail: "Seller liability capped at $2.125M (25% of purchase price)", reference: "Section 10.1" },
        ],
        notAgreed: [
          { item: "Working Capital Target", detail: "Buyer proposes $340K; seller countered at $280K. Gap of $60K under negotiation." },
          { item: "Therapy Contract Assignment", detail: "Current therapy provider (RehabCare) requesting consent fee of $15K; parties disputing responsibility." },
        ],
        ambiguous: [
          { item: "Environmental Liability", detail: "Phase 1 report clean but Phase 2 not conducted; OTA silent on remediation responsibility if issues found post-close." },
          { item: "Capital Improvement Credits", detail: "Seller claims $120K in recent capital improvements should reduce buyer's escrow requirement; no formal mechanism in current draft." },
        ],
      },
      operationalImpact: [
        { area: "Clinical Operations", term: "Staffing Transition", impact: "Must maintain current care levels during 120-day retention period while integrating Cascadia protocols", actionRequired: "Deploy transition team lead by Day 1; schedule staff orientation within first 2 weeks" },
        { area: "Revenue Cycle", term: "Payer Re-credentialing", impact: "Potential 60-90 day gap in managed care revenue ($45K/month exposure)", actionRequired: "File all re-credentialing applications 30 days before close; establish cash reserve for gap period" },
        { area: "Physical Plant", term: "HVAC Replacement", impact: "$180K capital expenditure required within 18 months for east wing units", actionRequired: "Obtain 3 vendor quotes; schedule replacement for Q3 to avoid winter disruption" },
        { area: "IT Systems", term: "EHR Migration", impact: "PointClickCare license transfers but data migration may be needed within 180 days", actionRequired: "Evaluate PCC continuation vs. migration to Cascadia standard platform; decide within 60 days" },
      ],
      model: "claude-haiku-4-5-20251001",
      tokensUsed: 3842,
      createdAt: daysAgo(14),
      updatedAt: daysAgo(14),
    },
  });

  // ── Riverstone SNF (CHOW Filed) — OTA with analysis ──
  const otaRiverstone = await prisma.otaDocument.create({
    data: {
      dealId: chowDeal.id,
      fileName: "Riverstone_SNF_OTA_Executed.pdf",
      filePath: "/uploads/ota/riverstone-ota-executed.pdf",
      fileSize: 1_890_000,
      fileType: "application/pdf",
      uploadedById: doug.id,
      status: "COMPLETE",
      extractedText: "OPERATIONS TRANSFER AGREEMENT between Inland Empire Health Services (Seller) and Cascadia Healthcare Group (Buyer) for Riverstone Skilled Nursing Facility, Spokane, Washington...",
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
  });

  await prisma.otaAnalysis.create({
    data: {
      otaDocumentId: otaRiverstone.id,
      summary: "• 90-bed SNF in Spokane, WA; built 2015, excellent condition with minimal deferred maintenance\n• Purchase price $6.2M with $620K escrow holdback for 12 months\n• Washington CHOW requires surety bond ($25K secured) and Certificate of Need review\n• All 72 current residents transfer; census has been stable at 80% for 18 months\n• Seller provides 90-day post-close transition support at no additional cost",
      sections: {
        staffing: [
          { title: "Full Staff Complement", detail: "68 FTEs across all departments; no agency staff currently utilized. Turnover rate of 12% annually." },
          { title: "Retention Agreement", detail: "Buyer offers employment to all current staff at same or better compensation; 90-day guarantee period." },
          { title: "Administrator", detail: "Current NHA retiring; buyer has identified replacement with WA license already in hand." },
        ],
        financial: [
          { title: "Purchase Price", detail: "$6.2M total: $4.8M real property, $1.1M operations, $300K FF&E." },
          { title: "Revenue Profile", detail: "Annual revenue $7.8M. Payer mix: Medicare 38%, Medicaid 35%, Managed Care 18%, Private 9%." },
          { title: "Operating Margin", detail: "Current EBITDA margin of 16.4%; projected to improve to 19% under Cascadia management." },
        ],
        regulatory: [
          { title: "WA CHOW Status", detail: "Application filed; surety bond ($25K) secured with Pacific Surety. Background checks submitted." },
          { title: "Certificate of Need", detail: "WA requires CON review as part of CHOW; filed concurrently. 60-day estimated review." },
          { title: "Survey History", detail: "Clean survey history — no IJ citations in last 5 years; most recent survey had 2 minor deficiencies." },
        ],
        operations: [
          { title: "Facility Condition", detail: "Built 2015; roof warranty through 2030. All major systems in excellent condition." },
          { title: "EHR System", detail: "MatrixCare platform with 3 years remaining on contract. Compatible with Cascadia systems." },
          { title: "Therapy Services", detail: "In-house therapy program with 4 therapists (2 PT, 1 OT, 1 SLP). Strong outcomes data." },
        ],
        timeline: [
          { title: "CHOW Approval", detail: "Expected within 60 days of filing; interim approval possible within 30 days." },
          { title: "Close Target", detail: "30 days from today; contingent on CHOW approval." },
          { title: "Post-Close Support", detail: "Seller provides 90-day transition assistance including outgoing administrator availability." },
        ],
        legal: [
          { title: "Clean Title", detail: "Title commitment clear; no liens or encumbrances. Title insurance secured." },
          { title: "Non-Compete", detail: "Seller agrees to 5-year, 75-mile non-compete for SNF operations in Washington state." },
          { title: "Indemnification", detail: "Seller indemnifies for pre-close liabilities; cap at 20% of purchase price ($1.24M)." },
        ],
      },
      risks: [
        { title: "CON Review Delay", severity: "medium", description: "WA Certificate of Need review could extend beyond 60 days if additional information requested.", recommendation: "Maintain regular contact with WA DOH reviewer; have supplemental documentation ready." },
        { title: "Administrator Transition", severity: "low", description: "Current NHA retiring; replacement identified but not yet on-boarded.", recommendation: "Finalize employment agreement with new NHA; arrange overlap period for knowledge transfer." },
        { title: "Managed Care Contract Terms", severity: "low", description: "Two managed care contracts have 90-day termination clauses that payers could exercise.", recommendation: "Schedule introductory meetings with managed care contacts before close to ensure continuity." },
      ],
      compliance: [
        { regulation: "WAC 388-97 — Nursing Home Licensing", concern: "New administrator must be licensed in WA within 30 days of assuming duties", severity: "low" },
        { regulation: "WA Certificate of Need (RCW 70.38)", concern: "CON approval required before ownership transfer becomes effective", severity: "medium" },
        { regulation: "WA Background Check Requirements", concern: "All principals and key personnel must clear WA DSHS background checks", severity: "low" },
      ],
      agreedVsOpen: {
        agreed: [
          { item: "Purchase Price", detail: "$6.2M with standard allocation", reference: "Section 2.1" },
          { item: "Surety Bond", detail: "$25K bond secured per WA requirements", reference: "Section 4.6" },
          { item: "Transition Support", detail: "90-day post-close assistance at seller's expense", reference: "Section 8.1" },
          { item: "Non-Compete", detail: "5-year, 75-mile for SNF operations", reference: "Section 9.1" },
        ],
        notAgreed: [
          { item: "Escrow Release Schedule", detail: "Buyer wants 12-month single release; seller proposes 6-month release." },
        ],
        ambiguous: [
          { item: "Therapy Program Transition", detail: "In-house therapy staff are employees but OTA doesn't specify if therapy contracts with outside referral sources transfer." },
        ],
      },
      operationalImpact: [
        { area: "Administration", term: "NHA Transition", impact: "New administrator must be on-boarded and oriented to facility within first 2 weeks", actionRequired: "Complete NHA employment agreement; schedule facility orientation and staff introductions" },
        { area: "Clinical", term: "Staff Retention", impact: "High retention expected given no agency usage and low turnover; minimal disruption anticipated", actionRequired: "Host all-staff meeting within first 48 hours; communicate job security and Cascadia benefits" },
        { area: "Financial", term: "Revenue Continuity", impact: "Strong payer mix with stable census should provide smooth financial transition", actionRequired: "Set up new billing NPI within 30 days; notify all payers of ownership change" },
      ],
      model: "claude-haiku-4-5-20251001",
      tokensUsed: 3256,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
  });

  // ── Pinecrest ALF (Closing) — OTA with analysis ──
  const otaPinecrest = await prisma.otaDocument.create({
    data: {
      dealId: closingDeal.id,
      fileName: "Pinecrest_ALF_Operations_Transfer_Agreement.pdf",
      filePath: "/uploads/ota/pinecrest-ota.pdf",
      fileSize: 1_620_000,
      fileType: "application/pdf",
      uploadedById: maria.id,
      status: "COMPLETE",
      extractedText: "OPERATIONS TRANSFER AGREEMENT between Willamette Valley Senior Living (Seller) and Cascadia Healthcare Group (Buyer) for Pinecrest Assisted Living, Eugene, Oregon...",
      createdAt: daysAgo(15),
      updatedAt: daysAgo(15),
    },
  });

  await prisma.otaAnalysis.create({
    data: {
      otaDocumentId: otaPinecrest.id,
      summary: "• 56-bed ALF in Eugene, OR; established community with 94% occupancy and strong private-pay base\n• Purchase price $3.9M; straightforward asset purchase with $390K escrow\n• Oregon CHOW approval already received — clear path to close within 7 days\n• 28 of 30 staff retained; two voluntary departures already backfilled\n• No Certificate of Need required for ALF transfers in Oregon",
      sections: {
        staffing: [
          { title: "Caregiver Ratios", detail: "Current ratio of 1:8 during day, 1:12 at night. Meets Oregon minimum; Cascadia plans to improve to 1:7 day." },
          { title: "Staff Retention", detail: "28 of 30 staff accepting offers; 2 departures (retirement, relocation) already backfilled." },
          { title: "Training Requirements", detail: "All caregivers current on Oregon OSBN requirements; CPR/First Aid certifications valid through 2027." },
        ],
        financial: [
          { title: "Revenue Model", detail: "85% private pay, 15% Medicaid waiver. Average private-pay rate $4,200/month — 12% below market." },
          { title: "Occupancy", detail: "53 of 56 units occupied (94.6%). Waitlist of 4 prospective residents." },
          { title: "Upside Opportunity", detail: "Rate increase to market ($4,700/month) projected to add $318K annual revenue." },
        ],
        regulatory: [
          { title: "Oregon CHOW", detail: "Approval received from Oregon Health Authority on January 28, 2026." },
          { title: "Administrator Certification", detail: "Buyer's designated administrator holds current Oregon ALF administrator certificate." },
          { title: "Inspection History", detail: "No Type A violations in last 3 inspection cycles; 1 minor Type B corrected on-site." },
        ],
        operations: [
          { title: "Memory Care Wing", detail: "12-bed secured memory care wing operates at 100% capacity with specialized programming." },
          { title: "Dietary Program", detail: "In-house kitchen with full-time chef; highly rated by residents in satisfaction surveys." },
          { title: "Transportation", detail: "Facility-owned 14-passenger bus; used for medical appointments and community outings." },
        ],
        timeline: [
          { title: "Close Date", detail: "Scheduled for 7 days from now; all contingencies satisfied." },
          { title: "Transition Day", detail: "Cascadia transition team of 4 assigned; 12-hour on-site coverage planned." },
          { title: "Integration", detail: "60-day integration plan including system migration and policy alignment." },
        ],
        legal: [
          { title: "Asset Purchase", detail: "Clean asset purchase; no assumed liabilities beyond assigned contracts." },
          { title: "Non-Compete", detail: "Seller non-compete: 2 years, 25 miles for assisted living operations." },
          { title: "Lease Assignment", detail: "Ground lease assigned with landlord consent; 15 years remaining with two 5-year options." },
        ],
      },
      risks: [
        { title: "Below-Market Rates", severity: "low", description: "Current private-pay rates 12% below market; rate increase may cause some resident attrition.", recommendation: "Phase rate increase over 6 months; grandfather existing residents at 5% increase initially." },
        { title: "Ground Lease Dependency", severity: "medium", description: "Facility operates on ground lease; landlord consent obtained but lease terms limit capital improvements over $50K.", recommendation: "Negotiate lease amendment for capital improvement flexibility before major renovations." },
      ],
      compliance: [
        { regulation: "OAR 411-054 — Assisted Living Facilities", concern: "Memory care wing staffing must meet enhanced requirements under Oregon rules", severity: "low" },
        { regulation: "Oregon Fair Housing Act", concern: "Admission criteria review needed to ensure compliance with updated state guidelines", severity: "low" },
      ],
      agreedVsOpen: {
        agreed: [
          { item: "Purchase Price", detail: "$3.9M asset purchase", reference: "Section 2.1" },
          { item: "CHOW Approval", detail: "Received January 28, 2026", reference: "Section 5.2" },
          { item: "Staff Transition", detail: "All current staff offered employment at comparable terms", reference: "Section 7.1" },
          { item: "Ground Lease Assignment", detail: "Landlord consent obtained; lease assigned at close", reference: "Section 4.3" },
        ],
        notAgreed: [],
        ambiguous: [
          { item: "Resident Trust Accounts", detail: "OTA references transfer of resident trust account balances but doesn't specify reconciliation process." },
        ],
      },
      operationalImpact: [
        { area: "Revenue", term: "Rate Optimization", impact: "Immediate opportunity to increase revenue $318K/year through market-rate adjustment", actionRequired: "Develop phased rate increase communication plan for residents and families" },
        { area: "Memory Care", term: "Program Enhancement", impact: "Memory care wing at capacity; potential to convert 4 additional rooms to expand program", actionRequired: "Assess conversion feasibility and regulatory requirements within 90 days" },
      ],
      model: "claude-haiku-4-5-20251001",
      tokensUsed: 2890,
      createdAt: daysAgo(15),
      updatedAt: daysAgo(15),
    },
  });

  // ── Mountain View ALF (LOI) — OTA uploaded but still analyzing ──
  await prisma.otaDocument.create({
    data: {
      dealId: loiDeal.id,
      fileName: "Mountain_View_ALF_OTA_Draft_v1.pdf",
      filePath: "/uploads/ota/mountain-view-ota-draft.pdf",
      fileSize: 980_000,
      fileType: "application/pdf",
      uploadedById: sarah.id,
      status: "UPLOADING",
      extractedText: "DRAFT — OPERATIONS TRANSFER AGREEMENT between Pacific Senior Care Inc (Seller) and Cascadia Healthcare Group (Buyer) for Mountain View Assisted Living, Portland, Oregon...",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
  });

  // ── Maple Grove SNF (Transition Day) — Fully analyzed OTA ──
  const otaMapleGrove = await prisma.otaDocument.create({
    data: {
      dealId: tdDeal.id,
      fileName: "Maple_Grove_SNF_OTA_Executed_Final.pdf",
      filePath: "/uploads/ota/maple-grove-ota-final.pdf",
      fileSize: 2_100_000,
      fileType: "application/pdf",
      uploadedById: sarah.id,
      status: "COMPLETE",
      extractedText: "EXECUTED OPERATIONS TRANSFER AGREEMENT between Magic Valley Healthcare LLC (Seller) and Cascadia Healthcare Group (Buyer) for Maple Grove Skilled Nursing, Twin Falls, Idaho...",
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
  });

  await prisma.otaAnalysis.create({
    data: {
      otaDocumentId: otaMapleGrove.id,
      summary: "• 100-bed SNF in Twin Falls, ID; transition day in progress with all pre-close items satisfied\n• Purchase price $7.1M; closing completed yesterday with clean title transfer\n• 87 residents in census; 13 beds available for post-acquisition growth\n• Idaho CHOW approved; new Medicare/Medicaid provider numbers active\n• Strong therapy program with in-house team generating 35% of revenue",
      sections: {
        staffing: [
          { title: "Full Retention Achieved", detail: "100% of clinical staff accepted employment offers. Total FTE count: 82." },
          { title: "Therapy Team", detail: "6 in-house therapists (3 PT, 2 OT, 1 SLP); strong Part A revenue generator." },
          { title: "New DNS Appointed", detail: "Sarah Chen designated as interim DNS for first 90 days; permanent hire in recruitment." },
        ],
        financial: [
          { title: "Purchase Price", detail: "$7.1M; $5.4M real property, $1.3M operations, $400K equipment." },
          { title: "Therapy Revenue", detail: "In-house therapy generates $2.7M annually (35% of total revenue); strong Part A utilization." },
          { title: "Medicaid Rate", detail: "Idaho Medicaid per diem of $198.50; rate review pending for July increase." },
        ],
        regulatory: [
          { title: "CHOW Approved", detail: "Idaho DHW approval received; all regulatory requirements satisfied." },
          { title: "Provider Numbers", detail: "New Medicare and Medicaid provider numbers active as of close date." },
          { title: "Licenses Current", detail: "Facility license, fire certificate, and food service permit all current." },
        ],
        operations: [
          { title: "Census", detail: "87 of 100 beds (87%); upside potential with 13 available beds." },
          { title: "Physical Plant", detail: "Built 2008; good condition. Recent $200K renovation of rehab gym and dining room." },
          { title: "Technology", detail: "PointClickCare EHR; same platform as Cedar Ridge for operational consistency." },
        ],
        timeline: [
          { title: "Transition Day", detail: "In progress today. All pre-close items complete. Team on-site since 6am." },
          { title: "Week 1 Plan", detail: "Staff orientation, system access setup, policy distribution, community meet-and-greet." },
          { title: "90-Day Goals", detail: "Implement Cascadia clinical protocols, achieve 92% census, complete all system integrations." },
        ],
        legal: [
          { title: "Clean Closing", detail: "All conditions precedent satisfied; funds wired; deed recorded." },
          { title: "Seller Support", detail: "Seller providing 30-day phone support for operational questions." },
          { title: "Non-Compete", detail: "3-year, 50-mile non-compete for SNF operations in Idaho." },
        ],
      },
      risks: [
        { title: "DNS Vacancy", severity: "medium", description: "Permanent DNS position not yet filled; interim arrangement with Sarah Chen for 90 days.", recommendation: "Post DNS position within first week; target hire within 60 days to allow overlap." },
        { title: "Medicaid Rate Uncertainty", severity: "low", description: "Idaho Medicaid rate review pending; outcome could affect 42% of revenue.", recommendation: "Participate in rate review process; model scenarios for potential rate changes." },
      ],
      compliance: [
        { regulation: "Idaho Admin Code 16.03.02", concern: "All staff must complete Cascadia orientation including abuse prevention training within 30 days", severity: "low" },
        { regulation: "CMS Quality Reporting", concern: "Quality measures must be reported under new provider number starting immediately", severity: "low" },
      ],
      agreedVsOpen: {
        agreed: [
          { item: "All Terms Executed", detail: "OTA fully executed with no open items; all conditions satisfied at closing", reference: "Entire Agreement" },
          { item: "Purchase Price", detail: "$7.1M with agreed allocation", reference: "Section 2.1" },
          { item: "Employee Transition", detail: "100% staff retention achieved", reference: "Section 7" },
          { item: "Regulatory Approvals", detail: "Idaho CHOW and all permits approved and transferred", reference: "Section 5" },
        ],
        notAgreed: [],
        ambiguous: [],
      },
      operationalImpact: [
        { area: "Clinical", term: "Protocol Integration", impact: "Must transition from seller's clinical protocols to Cascadia standards within 90 days", actionRequired: "Deploy clinical integration team; distribute new P&P manuals within Week 1" },
        { area: "Therapy", term: "Revenue Optimization", impact: "Strong in-house therapy program should be protected during transition to maintain Part A revenue", actionRequired: "Meet with therapy team Day 1 to confirm continuity; review utilization targets" },
        { area: "Census Growth", term: "Marketing Launch", impact: "13 available beds represent $1.2M annual revenue opportunity", actionRequired: "Launch marketing campaign and community outreach within 30 days" },
      ],
      model: "claude-haiku-4-5-20251001",
      tokensUsed: 3150,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
  });

  // ── Cascade Heights SNF (Post-Close) — Historical OTA ──
  const otaCascade = await prisma.otaDocument.create({
    data: {
      dealId: postCloseDeal.id,
      fileName: "Cascade_Heights_OTA_Executed.pdf",
      filePath: "/uploads/ota/cascade-heights-ota.pdf",
      fileSize: 2_340_000,
      fileType: "application/pdf",
      uploadedById: doug.id,
      status: "COMPLETE",
      extractedText: "EXECUTED OPERATIONS TRANSFER AGREEMENT for Cascade Heights Skilled Nursing, Seattle, Washington...",
      createdAt: daysAgo(35),
      updatedAt: daysAgo(35),
    },
  });

  await prisma.otaAnalysis.create({
    data: {
      otaDocumentId: otaCascade.id,
      summary: "• 130-bed SNF in Seattle, WA; largest acquisition in Cascadia portfolio at $11.5M\n• Transition completed 28 days ago; all post-close milestones on track\n• 112 current residents (86% census); strong Medicare Advantage presence\n• Full staff retention achieved with zero turnover during transition period\n• Integration substantially complete; operating under Cascadia protocols",
      sections: {
        staffing: [
          { title: "Staffing Complete", detail: "94 FTEs fully transitioned to Cascadia employment; no turnover during 28-day transition." },
          { title: "Leadership Team", detail: "New NHA and DNS in place; both previously operated Cascadia facilities." },
          { title: "Agency Elimination", detail: "Eliminated 6 agency positions by converting to permanent staff with sign-on bonuses." },
        ],
        financial: [
          { title: "Purchase Price", detail: "$11.5M; largest acquisition to date. Currently performing above pro forma projections." },
          { title: "Revenue", detail: "Monthly revenue of $1.1M; trending 4% above initial projections due to census growth." },
          { title: "Cost Synergies", detail: "Group purchasing and shared services generating $15K/month in savings vs. prior operations." },
        ],
        regulatory: [
          { title: "WA CHOW Complete", detail: "Full regulatory approval received; all licenses transferred." },
          { title: "Medicare Advantage", detail: "All 4 MA contracts successfully re-credentialed within 45 days." },
          { title: "Survey Ready", detail: "Post-acquisition survey readiness assessment scored 94%; no deficiencies expected." },
        ],
        operations: [
          { title: "Census Growth", detail: "Grew from 108 to 112 residents in first month (86% occupancy); targeting 120 by Q2." },
          { title: "Quality Scores", detail: "Maintained 4-star CMS rating through transition; targeting 5-star by next review cycle." },
          { title: "Systems", detail: "Fully migrated to Cascadia EHR (PointClickCare) with all historical data preserved." },
        ],
        timeline: [
          { title: "Transition Complete", detail: "All Day 1 and Week 1 checklist items completed successfully." },
          { title: "Integration Status", detail: "90% of integration milestones achieved in first 28 days." },
          { title: "Remaining Items", detail: "Final items: complete staff performance reviews and finalize vendor renegotiations." },
        ],
        legal: [
          { title: "Escrow Status", detail: "$1.15M escrow active; no claims filed. First release at 6 months." },
          { title: "Seller Compliance", detail: "Seller meeting all post-close obligations; no disputes." },
          { title: "Insurance", detail: "Tail policy active for pre-close professional liability; Cascadia coverage effective from close." },
        ],
      },
      risks: [
        { title: "Census Target Aggressive", severity: "low", description: "Target of 120 residents by Q2 requires adding 8 admissions in 60 days.", recommendation: "Continue marketing push; leverage Cascadia referral network from other facilities." },
      ],
      compliance: [
        { regulation: "WA Quality Assurance", concern: "First post-acquisition quality assessment due within 60 days; preparation underway", severity: "low" },
      ],
      agreedVsOpen: {
        agreed: [
          { item: "All Terms Satisfied", detail: "Transaction fully closed and all post-close obligations being met", reference: "Entire Agreement" },
        ],
        notAgreed: [],
        ambiguous: [],
      },
      operationalImpact: [
        { area: "Growth", term: "Census Building", impact: "8 additional admissions needed to hit 120-bed target; each bed worth ~$8K/month", actionRequired: "Weekly admissions review; deploy community liaison for hospital discharge planning" },
      ],
      model: "claude-haiku-4-5-20251001",
      tokensUsed: 2980,
      createdAt: daysAgo(35),
      updatedAt: daysAgo(35),
    },
  });

  const otaCount = 6; // 5 with analysis, 1 draft

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
  console.log(`DD Docs:          ${ddDocs.length} (Cedar Ridge)`);
  console.log(`OTA Documents:    ${otaCount} (5 analyzed, 1 draft)`);
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
