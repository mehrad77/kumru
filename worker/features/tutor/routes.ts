/* POST /api/ai (docs/SPECS.md section 10.7): the paid-tier hook. No provider code in these phases. */
import { HttpError } from "../../core/http.ts";
import type { Ctx } from "../../core/router.ts";
import { requireUser } from "../../core/session.ts";

export async function ai(ctx: Ctx): Promise<Response> {
  const { user } = await requireUser(ctx);
  if (user.plan === "free") throw new HttpError("payment_required", "AI help is part of a paid plan, which doesn't exist yet.");
  throw new HttpError("not_implemented", "AI help isn't available yet.");
}
