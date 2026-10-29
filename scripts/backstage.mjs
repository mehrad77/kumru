// `pnpm backstage`: Sahne's story editor (sahne/packages/sahne-backstage/README.md) on Kumru's content, with saves on.
// It runs as its own process on its own port, apart from `pnpm dev`, whose reload on a data/ change must not wipe the
// editor. The content root is scripts/data.mjs `sahneContent`, as for the gates: data/ on the real data, the view of it
// without the course folders on data-sample/. PORT sets the port (default 5181).
import { startBackstage } from "sahne-backstage/server";
import { sahneContent } from "./data.mjs";

const b = await startBackstage({ content: sahneContent(), write: true, port: Number(process.env.PORT || 5181) });
console.log(`backstage on ${b.url}`);
