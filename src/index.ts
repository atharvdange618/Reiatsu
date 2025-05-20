import { use } from "./core/router";
import { startServer } from "./core/server";
import { jsonBodyParserMiddleware } from "./middleware/jsonBodyParser";
import { loggerMiddleware } from "./middleware/logger";

use(loggerMiddleware);
use(jsonBodyParserMiddleware);

startServer(3000);
