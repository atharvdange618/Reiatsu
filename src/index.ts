import { use } from "./core/router";
import { startServer } from "./core/server";
import { bodyParserMiddleware } from "./middleware/bodyParser";
import { errorHandlerMiddleware } from "./middleware/errorHandler";
import { loggerMiddleware } from "./middleware/logger";
import { responseHelpersMiddleware } from "./middleware/responseHelpers";
import { serveStatic } from "./middleware/static";

use(errorHandlerMiddleware);
use(loggerMiddleware);
use(responseHelpersMiddleware);
// use(urlEncodedBodyParserMiddleware);
// use(jsonBodyParserMiddleware);
use(bodyParserMiddleware);
use(serveStatic("public"));

import "./routes";

startServer(3000);
