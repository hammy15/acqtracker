import { router } from "./trpc";
import { dealsRouter } from "./routers/deals";
import { tasksRouter } from "./routers/tasks";
import { filesRouter } from "./routers/files";
import { chatRouter } from "./routers/chat";
import { feedRouter } from "./routers/feed";
import { templatesRouter } from "./routers/templates";
import { usersRouter } from "./routers/users";
import { buildingsRouter } from "./routers/buildings";
import { archiveRouter } from "./routers/archive";
import { activityRouter } from "./routers/activity";
import { reportsRouter } from "./routers/reports";
import { stateReqsRouter } from "./routers/stateReqs";
import { otaRouter } from "./routers/ota";
import { aiRouter } from "./routers/ai";
import { orgSettingsRouter } from "./routers/orgSettings";

export const appRouter = router({
  deals: dealsRouter,
  tasks: tasksRouter,
  files: filesRouter,
  chat: chatRouter,
  feed: feedRouter,
  templates: templatesRouter,
  users: usersRouter,
  buildings: buildingsRouter,
  archive: archiveRouter,
  activity: activityRouter,
  reports: reportsRouter,
  stateReqs: stateReqsRouter,
  ota: otaRouter,
  ai: aiRouter,
  orgSettings: orgSettingsRouter,
});

export type AppRouter = typeof appRouter;
