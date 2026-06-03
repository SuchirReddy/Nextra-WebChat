import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { adminService } from "@/server/services/admin-service";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["open", "in_review", "resolved", "dismissed"])
});

export async function PATCH(req: NextRequest, props: { params: Promise<{ reportId: string }> }) {
  try {
    const user = await requireUser();
    await adminService.requireAdmin(user.id);

    const { reportId } = await props.params;
    const body = await req.json();
    const { status } = updateSchema.parse(body);

    const updated = await adminService.updateReportStatus(reportId, status, user.id);
    if (!updated) {
      return fail("Report not found", 404);
    }
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
