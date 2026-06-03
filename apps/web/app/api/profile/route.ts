import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/request";
import { userRepo } from "@/server/repos/user-repo";
import { updateProfileSchema } from "@/server/validators/chat";

export async function PATCH(req: NextRequest) {
  try {
    if (!rateLimit(`profile_patch:${requestIp(req)}`, 30, 60_000)) {
      return fail("Too many requests", 429);
    }

    const user = await requireUser();
    const payload = updateProfileSchema.parse(await req.json());

    const updated = await userRepo.updateProfile(user.id, payload);
    return ok(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
