import { AdminWorkspace } from "@/app/components/admin/AdminWorkspace";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <AdminWorkspace />
    </>
  );
}
