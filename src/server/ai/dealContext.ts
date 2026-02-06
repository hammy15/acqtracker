import { db } from "@/server/db";

const BASE_SYSTEM_PROMPT = `You are the Acquisition Checklist AI assistant, an expert in healthcare facility acquisitions (SNF, ALF, ILF, Hospice, In-Home). You help acquisition teams track deals, manage checklists, understand OTA agreements, and provide analytics across their portfolio.

Key domain knowledge:
- SNF = Skilled Nursing Facility, ALF = Assisted Living Facility, ILF = Independent Living Facility
- OTA = Operations Transfer Agreement - the critical document governing how facility operations transfer from seller to buyer
- CHOW = Change of Ownership - the regulatory filing required when a healthcare facility changes hands
- Deal lifecycle: Pipeline -> LOI -> Due Diligence -> CHOW Filed -> Closing -> Transition Day -> Week 1 -> Week 2 -> Post-Close
- Transition Day is the most critical milestone - when physical operations transfer to the new owner
- Each deal has workstreams (Clinical, Regulatory, HR, IT, Facilities, Finance, Legal) with tasks organized by phase
- State requirements vary significantly - each state has different licensing bodies, CHOW processes, and timelines
- Task statuses: Not Started, In Progress, Under Review, Waiting, Blocked, Complete, N/A
- Building assignments track which team members are on-site at a facility

You have access to tools that let you query the deal database. Use them to provide accurate, data-driven answers. When referencing specific numbers or statuses, always use the tools to get current data rather than guessing.

Be concise but thorough. Format responses with markdown when helpful. If you're unsure about something, say so rather than making assumptions.`;

export async function buildSystemPrompt(
  orgId: string,
  dealId?: string
): Promise<string> {
  let contextSection = "";

  if (dealId) {
    try {
      const deal = await db.deal.findUnique({
        where: { id: dealId, orgId },
        include: {
          dealLead: {
            select: { id: true, name: true, email: true },
          },
          buildingAssignments: {
            where: { isActive: true },
            include: {
              user: {
                select: { id: true, name: true, role: true },
              },
            },
          },
          tasks: {
            select: { status: true },
          },
        },
      });

      if (deal) {
        const totalTasks = deal.tasks.length;
        const completedTasks = deal.tasks.filter(
          (t) => t.status === "COMPLETE"
        ).length;
        const blockedTasks = deal.tasks.filter(
          (t) => t.status === "BLOCKED"
        ).length;

        const teamMembers = deal.buildingAssignments
          .map((ba) => `${ba.user.name} (${ba.onSiteRole})`)
          .join(", ");

        contextSection = `

## Current Deal Context
You are currently focused on the following deal:
- **Deal Name:** ${deal.name}
- **Facility:** ${deal.facilityName} (${deal.facilityType})
- **Status:** ${deal.status}
- **State:** ${deal.state}
- **Bed Count:** ${deal.bedCount ?? "Not specified"}
- **Deal Lead:** ${deal.dealLead?.name ?? "Unassigned"}
- **Target Close Date:** ${deal.targetCloseDate ? deal.targetCloseDate.toISOString().split("T")[0] : "Not set"}
- **Task Progress:** ${completedTasks}/${totalTasks} completed (${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
- **Blocked Tasks:** ${blockedTasks}
- **Team Members:** ${teamMembers || "None assigned"}

When answering questions, prioritize information about this deal. You can still access other deals if asked.`;
      }
    } catch {
      // If deal fetch fails, continue without deal context
    }
  }

  if (!contextSection) {
    try {
      const deals = await db.deal.findMany({
        where: { orgId, status: { not: "ARCHIVED" } },
        select: { status: true },
      });

      const statusCounts = deals.reduce(
        (acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const statusSummary = Object.entries(statusCounts)
        .map(([status, count]) => `  - ${status}: ${count}`)
        .join("\n");

      contextSection = `

## Organization Portfolio Summary
The user's organization has ${deals.length} active deal(s):
${statusSummary || "  - No active deals"}

No specific deal is selected. You can help with portfolio-wide questions or the user can ask about a specific deal.`;
    } catch {
      contextSection = `

## Context
No specific deal context is loaded. You can help with general acquisition questions or use tools to look up specific deals.`;
    }
  }

  return BASE_SYSTEM_PROMPT + contextSection;
}
