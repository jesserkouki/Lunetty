import { Suspense } from "react";
import { notFound } from "next/navigation";
import { WorkspacePage } from "@/app/components/workspace/WorkspacePage";

const opticianSections = new Set([
  "dashboard",
  "orders",
  "inventory",
  "appointments",
  "customers",
  "products",
  "members",
  "locations",
  "store",
  "transactions",
  "activity",
  "settings",
  "profile",
  "setup",
]);

async function OpticianWorkspaceContent({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;
  const [section, resourceId, ...extraSegments] = segments;

  if (!section || !opticianSections.has(section) || extraSegments.length > 0) {
    notFound();
  }

  return (
    <WorkspacePage
      portal="optician"
      section={section}
      resourceId={resourceId}
    />
  );
}

export default function OpticianWorkspaceRoute({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  return (
    <Suspense fallback={<main className="center-page">Chargement de votre espace…</main>}>
      <OpticianWorkspaceContent params={params} />
    </Suspense>
  );
}
