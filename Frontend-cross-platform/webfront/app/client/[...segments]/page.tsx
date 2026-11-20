import { notFound } from "next/navigation";
import { WorkspacePage } from "@/app/components/workspace/WorkspacePage";

const clientSections = new Set([
  "profile",
  "stores",
  "products",
  "following",
  "addresses",
  "cart",
  "orders",
  "social",
  "appointments",
  "prescriptions",
  "notifications",
  "try-on",
]);

export default async function ClientWorkspaceRoute({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;
  const [section, resourceId, ...extraSegments] = segments;

  if (!section || !clientSections.has(section) || extraSegments.length > 0) {
    notFound();
  }

  return (
    <WorkspacePage
      portal="client"
      section={section}
      resourceId={resourceId}
    />
  );
}
