import { use } from "./core/router";
import { startServer } from "./core/server";
import { errorHandlerMiddleware } from "./middleware/errorHandler";
import { jsonBodyParserMiddleware } from "./middleware/jsonBodyParser";
import { loggerMiddleware } from "./middleware/logger";
import { responseHelpersMiddleware } from "./middleware/responseHelpers";
import { serveStatic } from "./middleware/static";

use(errorHandlerMiddleware);
use(loggerMiddleware);
use(responseHelpersMiddleware);
use(jsonBodyParserMiddleware);
use(serveStatic("public"));

import "./routes";

startServer(3000);
