// Share a link: copy it (and say so), then open the device's share menu where there is one. Both start from the tap, so the
// share menu still counts as user-initiated. Without either, the toast shows the link to copy by hand.
import { toast } from "./toast.ts";

export async function shareLink(url: string, title: string): Promise<void> {
  const copied = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(url).then(() => true, () => false) : Promise.resolve(false);
  const shared = navigator.share ? navigator.share({ title, url }).then(() => "done", (e) => (e && e.name === "AbortError" ? "cancelled" : "failed")) : Promise.resolve("none");
  const ok = await copied;
  if (ok) toast("Link copied");
  else if (await shared === "none") toast(url);
  await shared;
}
