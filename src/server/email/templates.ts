// ─────────────────────────────────────────────
// Email Templates for Acquisition Checklist
// All templates return raw HTML strings with inline styles.
// Primary brand color: teal #14b8a6
// ─────────────────────────────────────────────

const BRAND_COLOR = "#14b8a6";
const BRAND_COLOR_DARK = "#0d9488";
const TEXT_PRIMARY = "#1f2937";
const TEXT_SECONDARY = "#6b7280";
const BG_LIGHT = "#f9fafb";
const BORDER_COLOR = "#e5e7eb";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${BG_LIGHT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_LIGHT};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background-color:${BRAND_COLOR};padding:24px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.025em;">Acquisition Checklist</h1>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid ${BORDER_COLOR};background-color:${BG_LIGHT};">
            <p style="margin:0;font-size:12px;color:${TEXT_SECONDARY};text-align:center;">
              Acquisition Checklist &mdash; Healthcare Acquisition Management
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td style="background-color:${BRAND_COLOR};border-radius:6px;">
    <a href="${url}" target="_blank" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
      ${label}
    </a>
  </td></tr>
</table>`;
}

function badge(label: string, color: string): string {
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;background-color:${color}20;color:${color};">${label}</span>`;
}

// ─────────────────────────────────────────────
// Template: Task Assignment
// ─────────────────────────────────────────────

export function taskAssignmentEmail(
  assigneeName: string,
  taskTitle: string,
  dealName: string,
  taskUrl: string,
): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;color:${TEXT_PRIMARY};">
      Hi ${assigneeName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:${TEXT_PRIMARY};">
      You have been assigned a new task:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_LIGHT};border:1px solid ${BORDER_COLOR};border-radius:8px;padding:16px;margin-bottom:8px;">
      <tr><td>
        <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">${taskTitle}</p>
        <p style="margin:0;font-size:13px;color:${TEXT_SECONDARY};">Deal: ${dealName}</p>
      </td></tr>
    </table>
    ${button("View Task", taskUrl)}
    <p style="margin:0;font-size:13px;color:${TEXT_SECONDARY};">
      If you have questions about this task, reach out to your deal lead.
    </p>
  `);
}

// ─────────────────────────────────────────────
// Template: Task Blocked
// ─────────────────────────────────────────────

export function taskBlockedEmail(
  leadName: string,
  taskTitle: string,
  dealName: string,
  reason: string,
  taskUrl: string,
): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;color:${TEXT_PRIMARY};">
      Hi ${leadName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:${TEXT_PRIMARY};">
      A task has been flagged as ${badge("BLOCKED", "#ef4444")} and may need your attention:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:8px;">
      <tr><td>
        <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">${taskTitle}</p>
        <p style="margin:0 0 8px;font-size:13px;color:${TEXT_SECONDARY};">Deal: ${dealName}</p>
        <p style="margin:0;font-size:13px;color:#991b1b;"><strong>Reason:</strong> ${reason}</p>
      </td></tr>
    </table>
    ${button("Review Task", taskUrl)}
  `);
}

// ─────────────────────────────────────────────
// Template: Transition Day Reminder
// ─────────────────────────────────────────────

export function transitionDayReminderEmail(
  memberName: string,
  dealName: string,
  facilityName: string,
  transitionDate: string,
  scheduleUrl: string,
): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;color:${TEXT_PRIMARY};">
      Hi ${memberName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:${TEXT_PRIMARY};">
      Transition Day is approaching for the following facility:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px;margin-bottom:8px;">
      <tr><td>
        <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:${TEXT_PRIMARY};">${facilityName}</p>
        <p style="margin:0 0 8px;font-size:13px;color:${TEXT_SECONDARY};">Deal: ${dealName}</p>
        <p style="margin:0;font-size:14px;color:${BRAND_COLOR_DARK};font-weight:600;">
          Transition Date: ${transitionDate}
        </p>
      </td></tr>
    </table>
    ${button("View Schedule", scheduleUrl)}
    <p style="margin:0;font-size:13px;color:${TEXT_SECONDARY};">
      Make sure all pre-close tasks are completed before transition day.
    </p>
  `);
}

// ─────────────────────────────────────────────
// Template: Daily Digest
// ─────────────────────────────────────────────

interface DailyDigestStats {
  assigned: number;
  completed: number;
  blocked: number;
  overdue: number;
}

interface DigestTask {
  title: string;
  dealName: string;
  status: string;
  dueDate: string | null;
  url: string;
}

export function dailyDigestEmail(
  userName: string,
  stats: DailyDigestStats,
  tasks: DigestTask[],
  dashboardUrl: string,
): string {
  const statBoxes = [
    { label: "Assigned", value: stats.assigned, color: BRAND_COLOR },
    { label: "Completed", value: stats.completed, color: "#22c55e" },
    { label: "Blocked", value: stats.blocked, color: "#ef4444" },
    { label: "Overdue", value: stats.overdue, color: "#f59e0b" },
  ];

  const statsHtml = statBoxes
    .map(
      (s) => `
    <td width="25%" style="padding:4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_LIGHT};border:1px solid ${BORDER_COLOR};border-radius:6px;text-align:center;padding:12px 8px;">
        <tr><td>
          <p style="margin:0;font-size:24px;font-weight:700;color:${s.color};">${s.value}</p>
          <p style="margin:4px 0 0;font-size:11px;color:${TEXT_SECONDARY};text-transform:uppercase;letter-spacing:0.05em;">${s.label}</p>
        </td></tr>
      </table>
    </td>`,
    )
    .join("");

  const taskRows = tasks
    .slice(0, 10)
    .map((t) => {
      const statusColor =
        t.status === "BLOCKED"
          ? "#ef4444"
          : t.status === "IN_PROGRESS"
            ? BRAND_COLOR
            : t.status === "UNDER_REVIEW"
              ? "#8b5cf6"
              : TEXT_SECONDARY;
      const dueDateStr = t.dueDate || "No due date";
      return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid ${BORDER_COLOR};">
          <a href="${t.url}" style="font-size:14px;color:${TEXT_PRIMARY};text-decoration:none;font-weight:500;">${t.title}</a>
          <p style="margin:4px 0 0;font-size:12px;color:${TEXT_SECONDARY};">${t.dealName} &middot; ${dueDateStr}</p>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid ${BORDER_COLOR};text-align:right;">
          ${badge(t.status.replace("_", " "), statusColor)}
        </td>
      </tr>`;
    })
    .join("");

  return layout(`
    <p style="margin:0 0 16px;font-size:15px;color:${TEXT_PRIMARY};">
      Good morning, ${userName}. Here is your daily summary.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>${statsHtml}</tr>
    </table>

    ${
      tasks.length > 0
        ? `
    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">Your Active Tasks</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER_COLOR};border-radius:8px;overflow:hidden;">
      ${taskRows}
    </table>
    ${tasks.length > 10 ? `<p style="margin:12px 0 0;font-size:12px;color:${TEXT_SECONDARY};">And ${tasks.length - 10} more tasks...</p>` : ""}
    `
        : `<p style="margin:0;font-size:14px;color:${TEXT_SECONDARY};">No active tasks. You are all caught up.</p>`
    }

    ${button("Open Dashboard", dashboardUrl)}
  `);
}

// ─────────────────────────────────────────────
// Template: Weekly Report
// ─────────────────────────────────────────────

interface WeeklyStats {
  tasksCompleted: number;
  tasksCreated: number;
  tasksBlocked: number;
  dealsProgressed: number;
  completionRate: number;
}

interface WeeklyDeal {
  name: string;
  facilityName: string;
  status: string;
  taskProgress: { completed: number; total: number };
  url: string;
}

export function weeklyReportEmail(
  userName: string,
  weeklyStats: WeeklyStats,
  deals: WeeklyDeal[],
  dashboardUrl: string,
): string {
  const dealRows = deals
    .slice(0, 8)
    .map((d) => {
      const pct =
        d.taskProgress.total > 0
          ? Math.round(
              (d.taskProgress.completed / d.taskProgress.total) * 100,
            )
          : 0;
      return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid ${BORDER_COLOR};">
          <a href="${d.url}" style="font-size:14px;color:${TEXT_PRIMARY};text-decoration:none;font-weight:500;">${d.name}</a>
          <p style="margin:4px 0 0;font-size:12px;color:${TEXT_SECONDARY};">${d.facilityName} &middot; ${d.status.replace("_", " ")}</p>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid ${BORDER_COLOR};text-align:right;white-space:nowrap;">
          <p style="margin:0;font-size:13px;color:${TEXT_PRIMARY};font-weight:600;">${d.taskProgress.completed}/${d.taskProgress.total}</p>
          <div style="width:60px;height:6px;background-color:${BORDER_COLOR};border-radius:3px;margin:4px 0 0 auto;">
            <div style="width:${pct}%;height:6px;background-color:${BRAND_COLOR};border-radius:3px;"></div>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  return layout(`
    <p style="margin:0 0 16px;font-size:15px;color:${TEXT_PRIMARY};">
      Hi ${userName}, here is your weekly progress report.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td width="33%" style="padding:4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:6px;text-align:center;padding:12px 8px;">
            <tr><td>
              <p style="margin:0;font-size:24px;font-weight:700;color:${BRAND_COLOR};">${weeklyStats.tasksCompleted}</p>
              <p style="margin:4px 0 0;font-size:11px;color:${TEXT_SECONDARY};text-transform:uppercase;">Completed</p>
            </td></tr>
          </table>
        </td>
        <td width="33%" style="padding:4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_LIGHT};border:1px solid ${BORDER_COLOR};border-radius:6px;text-align:center;padding:12px 8px;">
            <tr><td>
              <p style="margin:0;font-size:24px;font-weight:700;color:${TEXT_PRIMARY};">${weeklyStats.tasksCreated}</p>
              <p style="margin:4px 0 0;font-size:11px;color:${TEXT_SECONDARY};text-transform:uppercase;">Created</p>
            </td></tr>
          </table>
        </td>
        <td width="33%" style="padding:4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_LIGHT};border:1px solid ${BORDER_COLOR};border-radius:6px;text-align:center;padding:12px 8px;">
            <tr><td>
              <p style="margin:0;font-size:24px;font-weight:700;color:${BRAND_COLOR};">${weeklyStats.completionRate}%</p>
              <p style="margin:4px 0 0;font-size:11px;color:${TEXT_SECONDARY};text-transform:uppercase;">Completion</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>

    ${
      deals.length > 0
        ? `
    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${TEXT_PRIMARY};">Deal Progress</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER_COLOR};border-radius:8px;overflow:hidden;">
      ${dealRows}
    </table>
    `
        : `<p style="margin:0;font-size:14px;color:${TEXT_SECONDARY};">No active deals this week.</p>`
    }

    ${button("View Full Report", dashboardUrl)}
  `);
}
