import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { db } from "@/server/db";

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const aiTools: Tool[] = [
  {
    name: "get_deal_details",
    description:
      "Get detailed information about a specific deal including status, facility info, deal lead, and team assignments.",
    input_schema: {
      type: "object" as const,
      properties: {
        deal_id: {
          type: "string",
          description: "The ID of the deal to retrieve",
        },
      },
      required: ["deal_id"],
    },
  },
  {
    name: "get_deal_tasks",
    description:
      "Get tasks for a deal, optionally filtered by status. Returns task list with assignees, due dates, and progress stats.",
    input_schema: {
      type: "object" as const,
      properties: {
        deal_id: {
          type: "string",
          description: "The ID of the deal",
        },
        status: {
          type: "string",
          description:
            "Optional filter: NOT_STARTED, IN_PROGRESS, UNDER_REVIEW, WAITING, BLOCKED, COMPLETE, NA",
        },
      },
      required: ["deal_id"],
    },
  },
  {
    name: "search_deals",
    description:
      "Search for deals by name or facility name. Returns matching deals with basic info and status.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query to match against deal name or facility name",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_deal_stats",
    description:
      "Get task completion statistics for a specific deal or across all deals. Includes completion rates, blocked task counts, and breakdown by workstream and phase.",
    input_schema: {
      type: "object" as const,
      properties: {
        deal_id: {
          type: "string",
          description:
            "Optional deal ID. If omitted, returns aggregate stats across all active deals.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_ota_analysis",
    description:
      "Retrieve the OTA (Operations Transfer Agreement) analysis for a deal, including summary, risks, compliance concerns, and operational impact.",
    input_schema: {
      type: "object" as const,
      properties: {
        deal_id: {
          type: "string",
          description: "The ID of the deal to get OTA analysis for",
        },
      },
      required: ["deal_id"],
    },
  },
  {
    name: "compare_deals",
    description:
      "Compare progress, task stats, and key metrics across multiple deals side by side.",
    input_schema: {
      type: "object" as const,
      properties: {
        deal_ids: {
          type: "array",
          items: { type: "string" },
          description: "Array of deal IDs to compare (2-5 deals)",
        },
      },
      required: ["deal_ids"],
    },
  },
  {
    name: "list_all_deals",
    description:
      "List all active deals in the organization with their key info. Use this when you need to identify which deal the user is referring to, or to show them a list of available deals.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

async function getDealDetails(dealId: string, orgId: string) {
  const deal = await db.deal.findFirst({
    where: { id: dealId, orgId },
    include: {
      dealLead: {
        select: { id: true, name: true, email: true, role: true },
      },
      region: {
        select: { id: true, name: true },
      },
      buildingAssignments: {
        where: { isActive: true },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          taskFiles: true,
          chatChannels: true,
          otaDocuments: true,
        },
      },
    },
  });

  if (!deal) {
    return { error: "Deal not found or you do not have access." };
  }

  return {
    id: deal.id,
    name: deal.name,
    facilityName: deal.facilityName,
    facilityType: deal.facilityType,
    state: deal.state,
    address: deal.address,
    city: deal.city,
    zipCode: deal.zipCode,
    bedCount: deal.bedCount,
    currentOwner: deal.currentOwner,
    purchasePrice: deal.purchasePrice?.toString() ?? null,
    targetCloseDate: deal.targetCloseDate?.toISOString().split("T")[0] ?? null,
    actualCloseDate: deal.actualCloseDate?.toISOString().split("T")[0] ?? null,
    status: deal.status,
    dealLead: deal.dealLead,
    region: deal.region,
    team: deal.buildingAssignments.map((ba) => ({
      ...ba.user,
      onSiteRole: ba.onSiteRole,
    })),
    counts: deal._count,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  };
}

async function getDealTasks(
  dealId: string,
  orgId: string,
  status?: string
) {
  // Verify deal belongs to org
  const deal = await db.deal.findFirst({
    where: { id: dealId, orgId },
    select: { id: true, name: true },
  });

  if (!deal) {
    return { error: "Deal not found or you do not have access." };
  }

  const where: Record<string, unknown> = { dealId };
  if (status) {
    where.status = status;
  }

  const tasks = await db.task.findMany({
    where: where as any,
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ phase: "asc" }, { workstream: "asc" }, { sortOrder: "asc" }],
  });

  // Compute stats
  const allTasks = await db.task.findMany({
    where: { dealId },
    select: { status: true, workstream: true, phase: true },
  });

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.status === "COMPLETE").length;
  const blocked = allTasks.filter((t) => t.status === "BLOCKED").length;
  const inProgress = allTasks.filter((t) => t.status === "IN_PROGRESS").length;

  return {
    dealName: deal.name,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      workstream: t.workstream,
      section: t.section,
      phase: t.phase,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assignedTo?.name ?? "Unassigned",
      dueDate: t.dueDate?.toISOString().split("T")[0] ?? null,
      flagReason: t.flagReason,
    })),
    stats: {
      total,
      completed,
      blocked,
      inProgress,
      completionRate:
        total > 0 ? Math.round((completed / total) * 100) : 0,
    },
    filtered: status ? true : false,
    filterStatus: status ?? null,
  };
}

async function searchDeals(query: string, orgId: string) {
  const deals = await db.deal.findMany({
    where: {
      orgId,
      status: { not: "ARCHIVED" },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { facilityName: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { state: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      dealLead: {
        select: { id: true, name: true },
      },
      tasks: {
        select: { status: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return {
    query,
    resultCount: deals.length,
    deals: deals.map((deal) => {
      const totalTasks = deal.tasks.length;
      const completedTasks = deal.tasks.filter(
        (t) => t.status === "COMPLETE"
      ).length;
      return {
        id: deal.id,
        name: deal.name,
        facilityName: deal.facilityName,
        facilityType: deal.facilityType,
        state: deal.state,
        status: deal.status,
        dealLead: deal.dealLead?.name ?? "Unassigned",
        taskProgress: `${completedTasks}/${totalTasks}`,
        completionRate:
          totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0,
      };
    }),
  };
}

async function getDealStats(orgId: string, dealId?: string) {
  if (dealId) {
    // Stats for a specific deal
    const deal = await db.deal.findFirst({
      where: { id: dealId, orgId },
      select: { id: true, name: true, status: true },
    });

    if (!deal) {
      return { error: "Deal not found or you do not have access." };
    }

    const tasks = await db.task.findMany({
      where: { dealId },
      select: {
        status: true,
        workstream: true,
        phase: true,
        priority: true,
        flagReason: true,
        assignedTo: { select: { name: true } },
        dueDate: true,
        title: true,
      },
    });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "COMPLETE").length;
    const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
    const overdue = tasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate < new Date() &&
        t.status !== "COMPLETE" &&
        t.status !== "NA"
    ).length;

    // By workstream
    const byWorkstream = tasks.reduce(
      (acc, t) => {
        if (!acc[t.workstream])
          acc[t.workstream] = { total: 0, completed: 0, blocked: 0 };
        acc[t.workstream].total++;
        if (t.status === "COMPLETE") acc[t.workstream].completed++;
        if (t.status === "BLOCKED") acc[t.workstream].blocked++;
        return acc;
      },
      {} as Record<string, { total: number; completed: number; blocked: number }>
    );

    // By phase
    const byPhase = tasks.reduce(
      (acc, t) => {
        if (!acc[t.phase])
          acc[t.phase] = { total: 0, completed: 0, blocked: 0 };
        acc[t.phase].total++;
        if (t.status === "COMPLETE") acc[t.phase].completed++;
        if (t.status === "BLOCKED") acc[t.phase].blocked++;
        return acc;
      },
      {} as Record<string, { total: number; completed: number; blocked: number }>
    );

    // Blocked tasks detail
    const blockedTasks = tasks
      .filter((t) => t.status === "BLOCKED")
      .map((t) => ({
        title: t.title,
        workstream: t.workstream,
        assignedTo: t.assignedTo?.name ?? "Unassigned",
        flagReason: t.flagReason,
      }));

    return {
      dealId: deal.id,
      dealName: deal.name,
      dealStatus: deal.status,
      stats: {
        total,
        completed,
        blocked,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      byWorkstream,
      byPhase,
      blockedTasks,
    };
  }

  // Aggregate stats across all active deals
  const deals = await db.deal.findMany({
    where: { orgId, status: { not: "ARCHIVED" } },
    include: {
      tasks: { select: { status: true } },
    },
  });

  const summary = deals.map((deal) => {
    const total = deal.tasks.length;
    const completed = deal.tasks.filter((t) => t.status === "COMPLETE").length;
    const blocked = deal.tasks.filter((t) => t.status === "BLOCKED").length;
    return {
      id: deal.id,
      name: deal.name,
      status: deal.status,
      facilityType: deal.facilityType,
      tasks: { total, completed, blocked },
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const totalTasks = summary.reduce((sum, d) => sum + d.tasks.total, 0);
  const totalCompleted = summary.reduce(
    (sum, d) => sum + d.tasks.completed,
    0
  );
  const totalBlocked = summary.reduce((sum, d) => sum + d.tasks.blocked, 0);

  return {
    dealCount: deals.length,
    aggregate: {
      totalTasks,
      totalCompleted,
      totalBlocked,
      overallCompletionRate:
        totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
    },
    deals: summary,
  };
}

async function getOtaAnalysis(dealId: string, orgId: string) {
  const deal = await db.deal.findFirst({
    where: { id: dealId, orgId },
    select: { id: true, name: true },
  });

  if (!deal) {
    return { error: "Deal not found or you do not have access." };
  }

  const otaDocs = await db.otaDocument.findMany({
    where: { dealId },
    include: {
      analysis: true,
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (otaDocs.length === 0) {
    return {
      dealName: deal.name,
      message: "No OTA documents have been uploaded for this deal yet.",
    };
  }

  const analyzed = otaDocs.filter(
    (doc) => doc.status === "COMPLETE" && doc.analysis
  );

  if (analyzed.length === 0) {
    const pending = otaDocs.filter(
      (doc) => doc.status !== "COMPLETE" && doc.status !== "ERROR"
    );
    const errored = otaDocs.filter((doc) => doc.status === "ERROR");

    return {
      dealName: deal.name,
      message: "OTA documents exist but none have completed analysis yet.",
      documents: otaDocs.map((doc) => ({
        fileName: doc.fileName,
        status: doc.status,
        uploadedBy: doc.uploadedBy.name,
        uploadedAt: doc.createdAt.toISOString(),
      })),
      pendingCount: pending.length,
      errorCount: errored.length,
    };
  }

  // Return the most recent completed analysis
  const latest = analyzed[0];
  const analysis = latest.analysis!;

  return {
    dealName: deal.name,
    documentName: latest.fileName,
    uploadedBy: latest.uploadedBy.name,
    analyzedAt: analysis.createdAt.toISOString(),
    summary: analysis.summary,
    sections: analysis.sections,
    risks: analysis.risks,
    compliance: analysis.compliance,
    agreedVsOpen: analysis.agreedVsOpen,
    operationalImpact: analysis.operationalImpact,
  };
}

async function compareDeals(dealIds: string[], orgId: string) {
  if (dealIds.length < 2 || dealIds.length > 5) {
    return { error: "Please provide between 2 and 5 deal IDs to compare." };
  }

  const deals = await db.deal.findMany({
    where: { id: { in: dealIds }, orgId },
    include: {
      dealLead: { select: { name: true } },
      tasks: { select: { status: true, workstream: true, phase: true } },
      buildingAssignments: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  if (deals.length === 0) {
    return { error: "No matching deals found." };
  }

  const comparison = deals.map((deal) => {
    const total = deal.tasks.length;
    const completed = deal.tasks.filter((t) => t.status === "COMPLETE").length;
    const blocked = deal.tasks.filter((t) => t.status === "BLOCKED").length;
    const inProgress = deal.tasks.filter(
      (t) => t.status === "IN_PROGRESS"
    ).length;

    const workstreams = deal.tasks.reduce(
      (acc, t) => {
        if (!acc[t.workstream])
          acc[t.workstream] = { total: 0, completed: 0 };
        acc[t.workstream].total++;
        if (t.status === "COMPLETE") acc[t.workstream].completed++;
        return acc;
      },
      {} as Record<string, { total: number; completed: number }>
    );

    return {
      id: deal.id,
      name: deal.name,
      facilityName: deal.facilityName,
      facilityType: deal.facilityType,
      state: deal.state,
      status: deal.status,
      dealLead: deal.dealLead?.name ?? "Unassigned",
      targetCloseDate:
        deal.targetCloseDate?.toISOString().split("T")[0] ?? null,
      bedCount: deal.bedCount,
      teamSize: deal.buildingAssignments.length,
      taskStats: {
        total,
        completed,
        blocked,
        inProgress,
        completionRate:
          total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      workstreams,
    };
  });

  const notFound = dealIds.filter(
    (id) => !deals.find((d) => d.id === id)
  );

  return {
    comparison,
    ...(notFound.length > 0 && {
      notFound,
      warning: `${notFound.length} deal(s) were not found or not accessible.`,
    }),
  };
}

async function listAllDeals(orgId: string) {
  const deals = await db.deal.findMany({
    where: { orgId, status: { not: "ARCHIVED" } },
    include: {
      dealLead: { select: { name: true } },
      tasks: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return {
    totalDeals: deals.length,
    deals: deals.map((deal) => {
      const total = deal.tasks.length;
      const completed = deal.tasks.filter((t) => t.status === "COMPLETE").length;
      return {
        id: deal.id,
        name: deal.name,
        facilityName: deal.facilityName,
        facilityType: deal.facilityType,
        state: deal.state,
        city: deal.city,
        status: deal.status,
        dealLead: deal.dealLead?.name ?? "Unassigned",
        bedCount: deal.bedCount,
        targetCloseDate: deal.targetCloseDate?.toISOString().split("T")[0] ?? null,
        taskProgress: `${completed}/${total} (${total > 0 ? Math.round((completed / total) * 100) : 0}%)`,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export async function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  orgId: string
): Promise<string> {
  try {
    let result: unknown;

    switch (toolName) {
      case "get_deal_details":
        result = await getDealDetails(toolInput.deal_id as string, orgId);
        break;

      case "get_deal_tasks":
        result = await getDealTasks(
          toolInput.deal_id as string,
          orgId,
          toolInput.status as string | undefined
        );
        break;

      case "search_deals":
        result = await searchDeals(toolInput.query as string, orgId);
        break;

      case "get_deal_stats":
        result = await getDealStats(
          orgId,
          toolInput.deal_id as string | undefined
        );
        break;

      case "get_ota_analysis":
        result = await getOtaAnalysis(toolInput.deal_id as string, orgId);
        break;

      case "compare_deals":
        result = await compareDeals(
          toolInput.deal_ids as string[],
          orgId
        );
        break;

      case "list_all_deals":
        result = await listAllDeals(orgId);
        break;

      default:
        result = { error: `Unknown tool: ${toolName}` };
    }

    return JSON.stringify(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return JSON.stringify({ error: `Tool execution failed: ${message}` });
  }
}
