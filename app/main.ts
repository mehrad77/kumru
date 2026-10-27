// The module entry: styles, the host (window.kumru), the shell wiring, the features, then the boot sequence.
import "./styles/base.css";
import "./styles/components.css";
import "sahne-kit/kerim.css";
import "./ui/avatar/avatar.css";
import "./host/index.ts";
import { initOverlay } from "./core/overlay.ts";
import { initRouter } from "./core/router.ts";
import { startBoot } from "./core/startup.ts";
import { registerFeatures } from "./features/index.ts";
import { initSheets } from "./ui/sheet.ts";

initRouter();
initOverlay();
initSheets();
registerFeatures();
startBoot();
