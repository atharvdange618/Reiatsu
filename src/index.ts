import { use } from "./core/router";
import { startServer } from "./core/server";
import { loggerMiddleware } from "./middleware/logger";

use(loggerMiddleware);

startServer(3000);
