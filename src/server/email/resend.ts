import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@acquisitionchecklist.com";

export { resend, FROM_EMAIL };
