"use client";

import { useParams, redirect } from "next/navigation";

export default function ChecklistRedirect() {
  const params = useParams();
  const dealId = params.dealId as string;
  redirect(`/deals/${dealId}`);
}
