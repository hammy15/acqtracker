import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AcqTracker database...\n");

  // ─────────────────────────────────────────────
  // CLEANUP (idempotent)
  // ─────────────────────────────────────────────
  console.log("Cleaning existing data...");
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
  await prisma.organization.deleteMany();

  // ─────────────────────────────────────────────
  // 1. DEFAULT ORGANIZATION
  // ─────────────────────────────────────────────
  console.log("Creating organization...");
  const org = await prisma.organization.create({
    data: {
      name: "Hammy Healthcare Group",
      settings: {
        defaultFacilityType: "SNF",
        timezone: "America/Los_Angeles",
        dateFormat: "MM/dd/yyyy",
        requirePhotoVerification: true,
        autoCreateChannels: true,
        defaultChannels: ["general", "clinical", "regulatory", "facilities"],
        maxUploadSizeMB: 50,
        retentionDays: 365,
        features: {
          chat: true,
          feed: true,
          transitionDay: true,
          stateRequirements: true,
          dueDiligenceDocs: true,
        },
      },
    },
  });

  // ─────────────────────────────────────────────
  // 2. ADMIN USER
  // ─────────────────────────────────────────────
  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("password123", 12);

  const owen = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "admin@acqtracker.com",
      passwordHash,
      name: "Owen Richardson",
      role: "SUPER_ADMIN",
      phone: "+1-208-555-0100",
    },
  });

  // ─────────────────────────────────────────────
  // 3. ADDITIONAL USERS
  // ─────────────────────────────────────────────
  const steve = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "steve.anderson@acqtracker.com",
      passwordHash,
      name: "Steve Anderson",
      role: "ADMIN",
      phone: "+1-208-555-0101",
    },
  });

  const doug = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "doug.martinez@acqtracker.com",
      passwordHash,
      name: "Doug Martinez",
      role: "REGIONAL_LEAD",
      phone: "+1-503-555-0102",
    },
  });

  const sarah = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "sarah.chen@acqtracker.com",
      passwordHash,
      name: "Sarah Chen",
      role: "DEAL_LEAD",
      phone: "+1-208-555-0103",
    },
  });

  const tim = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "tim.brooks@acqtracker.com",
      passwordHash,
      name: "Tim Brooks",
      role: "DEPARTMENT_LEAD",
      phone: "+1-503-555-0104",
    },
  });

  const james = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "james.peterson@acqtracker.com",
      passwordHash,
      name: "James Peterson",
      role: "TEAM_MEMBER",
      phone: "+1-916-555-0105",
    },
  });

  // ─────────────────────────────────────────────
  // 4. REGIONS
  // ─────────────────────────────────────────────
  console.log("Creating regions...");
  const pacificNW = await prisma.region.create({
    data: {
      orgId: org.id,
      name: "Pacific Northwest",
      states: ["ID", "MT", "OR", "WA"],
      regionalLeadId: doug.id,
    },
  });

  const california = await prisma.region.create({
    data: {
      orgId: org.id,
      name: "California",
      states: ["CA"],
      regionalLeadId: doug.id,
    },
  });

  // Assign users to regions
  await prisma.user.update({
    where: { id: doug.id },
    data: { regionId: pacificNW.id },
  });
  await prisma.user.update({
    where: { id: sarah.id },
    data: { regionId: pacificNW.id },
  });
  await prisma.user.update({
    where: { id: tim.id },
    data: { regionId: pacificNW.id },
  });
  await prisma.user.update({
    where: { id: james.id },
    data: { regionId: california.id },
  });

  // ─────────────────────────────────────────────
  // 5. SNF PRE-CLOSE TEMPLATE
  // ─────────────────────────────────────────────
  console.log("Creating templates...");
  const preCloseTemplate = await prisma.template.create({
    data: {
      orgId: org.id,
      name: "SNF Pre-Close Template",
      templateType: "PRE_CLOSE",
      facilityType: "SNF",
      isDefault: true,
      createdById: owen.id,
    },
  });

  // Helper to create template tasks
  const preCloseTasks = [
    // Clinical Operations - Nursing
    { workstream: "Clinical Operations", section: "Nursing", title: "Review current staffing levels and schedules", sortOrder: 1 },
    { workstream: "Clinical Operations", section: "Nursing", title: "Verify RN/LVN/CNA ratios meet state requirements", sortOrder: 2 },
    { workstream: "Clinical Operations", section: "Nursing", title: "Obtain copy of current nursing policies and procedures", sortOrder: 3 },
    { workstream: "Clinical Operations", section: "Nursing", title: "Review infection control program", sortOrder: 4 },
    { workstream: "Clinical Operations", section: "Nursing", title: "Assess current clinical documentation practices", sortOrder: 5 },
    // Clinical Operations - Pharmacy
    { workstream: "Clinical Operations", section: "Pharmacy", title: "Review pharmacy consultant contract", sortOrder: 6 },
    { workstream: "Clinical Operations", section: "Pharmacy", title: "Verify narcotics storage and count procedures", sortOrder: 7 },
    { workstream: "Clinical Operations", section: "Pharmacy", title: "Review medication administration records", sortOrder: 8 },
    // Clinical Operations - Dietary
    { workstream: "Clinical Operations", section: "Dietary", title: "Review dietary service contract or in-house program", sortOrder: 9 },
    { workstream: "Clinical Operations", section: "Dietary", title: "Verify food service licenses and health inspections", sortOrder: 10 },
    { workstream: "Clinical Operations", section: "Dietary", title: "Review therapeutic diet capabilities", sortOrder: 11 },
    // Regulatory & Compliance - Licensing
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "File Change of Ownership (CHOW) application", sortOrder: 12 },
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "Obtain new facility license", sortOrder: 13 },
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "Update Medicare/Medicaid certification", sortOrder: 14 },
    { workstream: "Regulatory & Compliance", section: "Licensing", title: "Verify fire marshal inspection current", sortOrder: 15 },
    // Regulatory & Compliance - Surveys
    { workstream: "Regulatory & Compliance", section: "Surveys", title: "Obtain last 3 years of survey results", sortOrder: 16 },
    { workstream: "Regulatory & Compliance", section: "Surveys", title: "Review plan of correction history", sortOrder: 17 },
    { workstream: "Regulatory & Compliance", section: "Surveys", title: "Identify any current IJ citations", sortOrder: 18 },
    // Financial - Revenue
    { workstream: "Financial", section: "Revenue", title: "Analyze current payer mix", sortOrder: 19 },
    { workstream: "Financial", section: "Revenue", title: "Review Medicare Part A billing history", sortOrder: 20 },
    { workstream: "Financial", section: "Revenue", title: "Review Medicaid rate and pending rate changes", sortOrder: 21 },
    { workstream: "Financial", section: "Revenue", title: "Analyze managed care contracts", sortOrder: 22 },
    // Financial - Expenses
    { workstream: "Financial", section: "Expenses", title: "Review current vendor contracts", sortOrder: 23 },
    { workstream: "Financial", section: "Expenses", title: "Analyze staffing costs vs benchmarks", sortOrder: 24 },
    { workstream: "Financial", section: "Expenses", title: "Review utility costs and contracts", sortOrder: 25 },
    { workstream: "Financial", section: "Expenses", title: "Assess insurance coverage and costs", sortOrder: 26 },
    // Physical Plant - Building
    { workstream: "Physical Plant", section: "Building", title: "Conduct building walk-through inspection", sortOrder: 27, requiresPhoto: true },
    { workstream: "Physical Plant", section: "Building", title: "Review recent capital expenditures", sortOrder: 28 },
    { workstream: "Physical Plant", section: "Building", title: "Assess HVAC system condition", sortOrder: 29 },
    { workstream: "Physical Plant", section: "Building", title: "Review roof condition and warranty", sortOrder: 30 },
    { workstream: "Physical Plant", section: "Building", title: "Inspect fire safety systems", sortOrder: 31, requiresPhoto: true },
    // Physical Plant - Equipment
    { workstream: "Physical Plant", section: "Equipment", title: "Inventory major medical equipment", sortOrder: 32 },
    { workstream: "Physical Plant", section: "Equipment", title: "Verify equipment maintenance records", sortOrder: 33 },
    { workstream: "Physical Plant", section: "Equipment", title: "Assess laundry equipment condition", sortOrder: 34 },
    // HR & Staffing - Personnel
    { workstream: "HR & Staffing", section: "Personnel", title: "Obtain employee census and roster", sortOrder: 35 },
    { workstream: "HR & Staffing", section: "Personnel", title: "Review employee benefit programs", sortOrder: 36 },
    { workstream: "HR & Staffing", section: "Personnel", title: "Verify background check compliance", sortOrder: 37 },
    { workstream: "HR & Staffing", section: "Personnel", title: "Review workers compensation history", sortOrder: 38 },
    // HR & Staffing - Contracts
    { workstream: "HR & Staffing", section: "Contracts", title: "Review management agreements", sortOrder: 39 },
    { workstream: "HR & Staffing", section: "Contracts", title: "Review therapy contract (PT/OT/SLP)", sortOrder: 40 },
    { workstream: "HR & Staffing", section: "Contracts", title: "Review staffing agency utilization", sortOrder: 41 },
    // IT & Systems - Technology
    { workstream: "IT & Systems", section: "Technology", title: "Assess EHR system and contract", sortOrder: 42 },
    { workstream: "IT & Systems", section: "Technology", title: "Review phone/internet service contracts", sortOrder: 43 },
    { workstream: "IT & Systems", section: "Technology", title: "Verify data backup procedures", sortOrder: 44 },
    { workstream: "IT & Systems", section: "Technology", title: "Assess WiFi coverage throughout facility", sortOrder: 45 },
  ];

  const createdTemplateTasks = await Promise.all(
    preCloseTasks.map((t) =>
      prisma.templateTask.create({
        data: {
          templateId: preCloseTemplate.id,
          workstream: t.workstream,
          section: t.section,
          title: t.title,
          sortOrder: t.sortOrder,
          requiresPhoto: t.requiresPhoto ?? false,
          phase: "PRE_CLOSE",
        },
      })
    )
  );

  // ─────────────────────────────────────────────
  // 6. TRANSITION DAY TEMPLATE
  // ─────────────────────────────────────────────
  const dayOfTemplate = await prisma.template.create({
    data: {
      orgId: org.id,
      name: "SNF Transition Day Template",
      templateType: "DAY_OF",
      facilityType: "SNF",
      isDefault: true,
      createdById: owen.id,
    },
  });

  const dayOfTasks = [
    // Site Security
    { workstream: "Site Security", title: "Collect all keys from seller", sortOrder: 1, requiresPhoto: true },
    { workstream: "Site Security", title: "Change safe combination", sortOrder: 2 },
    { workstream: "Site Security", title: "Verify alarm codes changed", sortOrder: 3 },
    { workstream: "Site Security", title: "Photograph lobby and entrance", sortOrder: 4, requiresPhoto: true },
    { workstream: "Site Security", title: "Photograph all exterior doors", sortOrder: 5, requiresPhoto: true },
    // Clinical Handoff
    { workstream: "Clinical Handoff", title: "Verify narcotics count with outgoing DNS", sortOrder: 6, requiresPhoto: true },
    { workstream: "Clinical Handoff", title: "Complete resident census verification", sortOrder: 7 },
    { workstream: "Clinical Handoff", title: "Review 24-hour nursing report", sortOrder: 8 },
    { workstream: "Clinical Handoff", title: "Verify crash cart contents and seal", sortOrder: 9, requiresPhoto: true },
    { workstream: "Clinical Handoff", title: "Check controlled substance log", sortOrder: 10 },
    // Financial Cutoff
    { workstream: "Financial Cutoff", title: "Verify petty cash count", sortOrder: 11, requiresPhoto: true },
    { workstream: "Financial Cutoff", title: "Document accounts receivable cutoff", sortOrder: 12 },
    { workstream: "Financial Cutoff", title: "Record utility meter readings", sortOrder: 13, requiresPhoto: true },
    // Systems Transfer
    { workstream: "Systems Transfer", title: "Verify phone system transfer", sortOrder: 14 },
    { workstream: "Systems Transfer", title: "Check EHR system access", sortOrder: 15 },
    { workstream: "Systems Transfer", title: "Test fire panel all zones", sortOrder: 16 },
    { workstream: "Systems Transfer", title: "Verify internet connectivity", sortOrder: 17 },
    { workstream: "Systems Transfer", title: "Test nurse call system", sortOrder: 18 },
    // Photography
    { workstream: "Photography", title: "Photograph kitchen and dining", sortOrder: 19, requiresPhoto: true },
    { workstream: "Photography", title: "Photograph all resident wings", sortOrder: 20, requiresPhoto: true },
    { workstream: "Photography", title: "Photograph therapy gym", sortOrder: 21, requiresPhoto: true },
    { workstream: "Photography", title: "Photograph mechanical/utility rooms", sortOrder: 22, requiresPhoto: true },
    { workstream: "Photography", title: "Photograph parking lot and exterior", sortOrder: 23, requiresPhoto: true },
  ];

  await Promise.all(
    dayOfTasks.map((t) =>
      prisma.templateTask.create({
        data: {
          templateId: dayOfTemplate.id,
          workstream: t.workstream,
          title: t.title,
          sortOrder: t.sortOrder,
          requiresPhoto: t.requiresPhoto ?? false,
          phase: "DAY_OF",
        },
      })
    )
  );

  // ─────────────────────────────────────────────
  // 7. SAMPLE DEALS
  // ─────────────────────────────────────────────
  console.log("Creating deals...");
  const now = new Date();
  const daysFromNow = (days: number) => new Date(now.getTime() + days * 86400000);

  const cedarRidge = await prisma.deal.create({
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
      targetCloseDate: daysFromNow(60),
      status: "DUE_DILIGENCE",
      dealLeadId: sarah.id,
      regionId: pacificNW.id,
      templateId: preCloseTemplate.id,
    },
  });

  const mountainView = await prisma.deal.create({
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
    },
  });

  const sunsetGardens = await prisma.deal.create({
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
    },
  });

  // ─────────────────────────────────────────────
  // 8. TASKS FOR CEDAR RIDGE DEAL
  // ─────────────────────────────────────────────
  console.log("Creating tasks for Cedar Ridge deal...");

  // Map of assignees for variety
  const assignees = [owen, steve, sarah, tim, james, doug];

  const cedarRidgeTasks = await Promise.all(
    createdTemplateTasks.map((tt, i) => {
      // Determine status: first 15 COMPLETE, next 5 IN_PROGRESS, 2 BLOCKED, rest NOT_STARTED
      let status: "COMPLETE" | "IN_PROGRESS" | "BLOCKED" | "NOT_STARTED" = "NOT_STARTED";
      let completedDate: Date | null = null;
      let completedById: string | null = null;
      let flagReason: string | null = null;
      let assignedToId: string | null = null;

      // Assign users in a round-robin for the first 30 tasks
      if (i < 30) {
        assignedToId = assignees[i % assignees.length].id;
      }

      if (i < 15) {
        status = "COMPLETE";
        completedDate = new Date(now.getTime() - (15 - i) * 86400000); // stagger completion dates
        completedById = assignedToId ?? sarah.id;
      } else if (i < 20) {
        status = "IN_PROGRESS";
      } else if (i === 20) {
        status = "BLOCKED";
        flagReason = "Seller has not provided managed care contract details. Follow-up call scheduled for next Tuesday.";
      } else if (i === 21) {
        status = "BLOCKED";
        flagReason = "Waiting on vendor to provide updated pricing. Current contract expired last month.";
      }

      return prisma.task.create({
        data: {
          dealId: cedarRidge.id,
          templateTaskId: tt.id,
          title: preCloseTasks[i].title,
          workstream: preCloseTasks[i].workstream,
          section: preCloseTasks[i].section,
          phase: "PRE_CLOSE",
          sortOrder: preCloseTasks[i].sortOrder,
          status,
          priority: i < 5 ? "HIGH" : i < 15 ? "MEDIUM" : "MEDIUM",
          assignedToId,
          completedDate,
          completedById,
          flagReason,
          dueDate: daysFromNow(Math.floor(i * 1.3) + 5),
        },
      });
    })
  );

  // ─────────────────────────────────────────────
  // 9. STATE REQUIREMENTS
  // ─────────────────────────────────────────────
  console.log("Creating state requirements...");

  await prisma.stateRequirement.create({
    data: {
      orgId: org.id,
      stateCode: "ID",
      facilityType: "SNF",
      licensingBody: "Idaho Department of Health & Welfare",
      licensingBodyUrl: "https://healthandwelfare.idaho.gov",
      suretyBondRequired: true,
      suretyBondAmount: 50000,
      conRequired: false,
      backgroundCheckRequired: true,
      processingTimelineDays: 90,
      requirementsChecklist: {
        items: [
          "Completed CHOW application",
          "Administrator license verification",
          "Surety bond ($50,000)",
          "Background check results",
          "Fire inspection certificate",
          "Financial statements (3 years)",
        ],
      },
    },
  });

  await prisma.stateRequirement.create({
    data: {
      orgId: org.id,
      stateCode: "OR",
      facilityType: "SNF",
      licensingBody: "Oregon Health Authority",
      licensingBodyUrl: "https://www.oregon.gov/oha",
      suretyBondRequired: false,
      conRequired: true,
      backgroundCheckRequired: true,
      processingTimelineDays: 120,
      requirementsChecklist: {
        items: [
          "Completed CHOW application",
          "Certificate of Need application",
          "Administrator license verification",
          "Background check results",
          "Financial review documentation",
          "Staffing plan",
        ],
      },
    },
  });

  await prisma.stateRequirement.create({
    data: {
      orgId: org.id,
      stateCode: "WA",
      facilityType: "SNF",
      licensingBody: "Washington State Department of Health",
      licensingBodyUrl: "https://www.doh.wa.gov",
      suretyBondRequired: true,
      suretyBondAmount: 25000,
      conRequired: true,
      backgroundCheckRequired: true,
      processingTimelineDays: 90,
      requirementsChecklist: {
        items: [
          "Completed CHOW application",
          "Certificate of Need review",
          "Surety bond ($25,000)",
          "Background check results",
          "Administrator credentials",
          "Financial feasibility study",
        ],
      },
    },
  });

  await prisma.stateRequirement.create({
    data: {
      orgId: org.id,
      stateCode: "CA",
      facilityType: "SNF",
      licensingBody: "California Department of Public Health",
      licensingBodyUrl: "https://www.cdph.ca.gov",
      suretyBondRequired: false,
      conRequired: true,
      backgroundCheckRequired: true,
      processingTimelineDays: 180,
      requirementsChecklist: {
        items: [
          "Completed CHOW application",
          "Certificate of Need application",
          "Administrator license verification",
          "DOJ/FBI background checks",
          "Financial statements (5 years)",
          "Staffing plan and ratios",
          "Quality assurance plan",
          "Emergency preparedness plan",
        ],
      },
    },
  });

  // ─────────────────────────────────────────────
  // 10. CHAT CHANNELS FOR CEDAR RIDGE
  // ─────────────────────────────────────────────
  console.log("Creating chat channels...");

  const channelNames = ["general", "clinical", "regulatory", "facilities"];
  const channels: Record<string, Awaited<ReturnType<typeof prisma.chatChannel.create>>> = {};

  for (const name of channelNames) {
    channels[name] = await prisma.chatChannel.create({
      data: {
        dealId: cedarRidge.id,
        name,
        channelType: "AUTO",
      },
    });
  }

  // Add some chat messages
  await prisma.chatMessage.createMany({
    data: [
      {
        channelId: channels.general.id,
        userId: sarah.id,
        body: "Team, Cedar Ridge due diligence is officially kicked off. Let's target completing all clinical tasks within the first two weeks.",
      },
      {
        channelId: channels.general.id,
        userId: owen.id,
        body: "Great. I'll be on-site next Wednesday for the walk-through. Tim, can you join?",
      },
      {
        channelId: channels.general.id,
        userId: tim.id,
        body: "Confirmed. I'll drive up Tuesday evening.",
      },
      {
        channelId: channels.clinical.id,
        userId: sarah.id,
        body: "The current staffing ratios look tight. We may need to budget for additional CNAs post-acquisition.",
      },
      {
        channelId: channels.clinical.id,
        userId: tim.id,
        body: "I reviewed their infection control program. It's solid but the documentation needs updating to match our standards.",
      },
      {
        channelId: channels.regulatory.id,
        userId: doug.id,
        body: "Idaho CHOW application is straightforward. I've pulled the forms. We should file as soon as the LOI is countersigned.",
      },
      {
        channelId: channels.facilities.id,
        userId: james.id,
        body: "HVAC units on the east wing are original to the building (2003). We should budget for replacement within 18 months.",
      },
    ],
  });

  // ─────────────────────────────────────────────
  // 11. FEED POSTS FOR CEDAR RIDGE
  // ─────────────────────────────────────────────
  console.log("Creating feed posts...");

  await prisma.feedPost.createMany({
    data: [
      {
        dealId: cedarRidge.id,
        userId: owen.id,
        postType: "SYSTEM_EVENT",
        body: "Deal created: Cedar Ridge SNF Acquisition",
        metadata: { action: "DEAL_CREATED" },
        createdAt: new Date(now.getTime() - 30 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: sarah.id,
        postType: "MESSAGE",
        body: "Initial financial review looks promising. EBITDA margins are above market average at 18.2%. Payer mix is favorable with 35% Medicare Part A.",
        createdAt: new Date(now.getTime() - 25 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: owen.id,
        postType: "SYSTEM_EVENT",
        body: "Deal status changed from LOI to Due Diligence",
        metadata: { action: "DEAL_STATUS_CHANGED", from: "LOI", to: "DUE_DILIGENCE" },
        createdAt: new Date(now.getTime() - 20 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: tim.id,
        postType: "TASK_COMPLETE",
        body: "Completed: Review current staffing levels and schedules",
        taskId: cedarRidgeTasks[0].id,
        createdAt: new Date(now.getTime() - 14 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: sarah.id,
        postType: "TASK_FLAGGED",
        body: "Blocked: Analyze managed care contracts - Seller has not provided managed care contract details",
        taskId: cedarRidgeTasks[20].id,
        createdAt: new Date(now.getTime() - 5 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: james.id,
        postType: "MESSAGE",
        body: "Completed facility walk-through. Building is in good condition overall. East wing HVAC needs attention. Full report to follow.",
        createdAt: new Date(now.getTime() - 3 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: doug.id,
        postType: "MESSAGE",
        body: "Idaho CHOW application has been filed. Expected processing time is 90 days. I'll track the status weekly.",
        createdAt: new Date(now.getTime() - 1 * 86400000),
      },
    ],
  });

  // ─────────────────────────────────────────────
  // 12. BUILDING ASSIGNMENTS FOR CEDAR RIDGE
  // ─────────────────────────────────────────────
  console.log("Creating building assignments...");

  await prisma.buildingAssignment.createMany({
    data: [
      {
        dealId: cedarRidge.id,
        userId: owen.id,
        onSiteRole: "BUILDING_LEAD",
        assignedById: owen.id,
      },
      {
        dealId: cedarRidge.id,
        userId: steve.id,
        onSiteRole: "TEAM_MEMBER",
        assignedById: owen.id,
      },
      {
        dealId: cedarRidge.id,
        userId: sarah.id,
        onSiteRole: "BUILDING_LEAD",
        assignedById: owen.id,
      },
      {
        dealId: cedarRidge.id,
        userId: tim.id,
        onSiteRole: "TEAM_MEMBER",
        assignedById: sarah.id,
      },
      {
        dealId: cedarRidge.id,
        userId: james.id,
        onSiteRole: "TEAM_MEMBER",
        assignedById: sarah.id,
      },
    ],
  });

  // ─────────────────────────────────────────────
  // 13. ACTIVITY LOGS FOR CEDAR RIDGE
  // ─────────────────────────────────────────────
  console.log("Creating activity logs...");

  await prisma.activityLog.createMany({
    data: [
      {
        dealId: cedarRidge.id,
        userId: owen.id,
        action: "DEAL_CREATED",
        entityType: "Deal",
        entityId: cedarRidge.id,
        newValue: { name: "Cedar Ridge SNF Acquisition", status: "PIPELINE" },
        timestamp: new Date(now.getTime() - 30 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: owen.id,
        action: "DEAL_STATUS_CHANGED",
        entityType: "Deal",
        entityId: cedarRidge.id,
        oldValue: { status: "PIPELINE" },
        newValue: { status: "LOI" },
        timestamp: new Date(now.getTime() - 28 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: owen.id,
        action: "DEAL_STATUS_CHANGED",
        entityType: "Deal",
        entityId: cedarRidge.id,
        oldValue: { status: "LOI" },
        newValue: { status: "DUE_DILIGENCE" },
        timestamp: new Date(now.getTime() - 20 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: owen.id,
        action: "TASK_ASSIGNED",
        entityType: "Task",
        entityId: cedarRidgeTasks[0].id,
        newValue: { assignedTo: "Owen Richardson", task: "Review current staffing levels and schedules" },
        timestamp: new Date(now.getTime() - 19 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: owen.id,
        action: "TASK_COMPLETED",
        entityType: "Task",
        entityId: cedarRidgeTasks[0].id,
        newValue: { task: "Review current staffing levels and schedules" },
        timestamp: new Date(now.getTime() - 14 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: sarah.id,
        action: "USER_ASSIGNED_TO_BUILDING",
        entityType: "BuildingAssignment",
        newValue: { user: "Tim Brooks", role: "TEAM_MEMBER" },
        timestamp: new Date(now.getTime() - 18 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: sarah.id,
        action: "TASK_FLAGGED",
        entityType: "Task",
        entityId: cedarRidgeTasks[20].id,
        newValue: { task: "Analyze managed care contracts", reason: "Seller has not provided managed care contract details" },
        timestamp: new Date(now.getTime() - 5 * 86400000),
      },
      {
        dealId: cedarRidge.id,
        userId: doug.id,
        action: "COMMENT_ADDED",
        entityType: "Task",
        entityId: cedarRidgeTasks[11].id,
        newValue: { comment: "CHOW application filed with Idaho DHW" },
        timestamp: new Date(now.getTime() - 1 * 86400000),
      },
    ],
  });

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log("\n--- Seed Complete ---");
  console.log(`Organization:     ${org.name}`);
  console.log(`Users:            6`);
  console.log(`Regions:          2`);
  console.log(`Templates:        2 (Pre-Close: ${preCloseTasks.length} tasks, Day-Of: ${dayOfTasks.length} tasks)`);
  console.log(`Deals:            3`);
  console.log(`Cedar Ridge Tasks: ${cedarRidgeTasks.length}`);
  console.log(`State Reqs:       4 (ID, OR, WA, CA)`);
  console.log(`Chat Channels:    ${channelNames.length}`);
  console.log(`Building Assigns: 5`);
  console.log("");
  console.log("Admin login: admin@acqtracker.com / password123");
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
