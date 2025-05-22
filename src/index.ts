import { use } from "./core/router";
import { startServer } from "./core/server";
import { bodyParserMiddleware } from "./middleware/bodyParser";
import { errorHandlerMiddleware } from "./middleware/errorHandler";
import { loggerMiddleware } from "./middleware/logger";
import { createRateLimiter } from "./middleware/rateLimiter";
import { createRequestSizeLimiter } from "./middleware/requestSize";
import { createTimeoutMiddleware } from "./middleware/requestTimeout";
import { responseHelpersMiddleware } from "./middleware/responseHelpers";
import { serveStatic } from "./middleware/static";

use(errorHandlerMiddleware);

use(createTimeoutMiddleware(30000)); // 30 second timeout
use(createRateLimiter(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
use(createRequestSizeLimiter(2 * 1024 * 1024)); // 2MB limit

use(loggerMiddleware);
use(responseHelpersMiddleware);
use(bodyParserMiddleware);
use(serveStatic("public"));

import "./routes";

startServer(3000);
