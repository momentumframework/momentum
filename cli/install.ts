import { MvfManagerService } from "./global/services/mvf-manager.service.ts";

const manager = new MvfManagerService();
await manager.install();
