/**
 * @description HTTP server module
 * @param http
 */
import http from "http";

/**
 * @description Express Framework module
 * @param express
 */
import express from "express";

/**
 * @description Configure env variables
 * @param config
 */
import dotenv from "dotenv-safe";
// dotenv.load({
//   path: './config/.env',
//   sample: '.config/.env.example',
//   allowEmptyValues: false
// });
dotenv.config();
/**
 * @description Database config class
 * @param DBConfig
 */
import DBConfig from "./config/db.conf.js";

/**
 * @description Routes config class
 * @param Routes
 */
import { initRoutes } from "./config/routes.conf.js";

/**
 * @description IApplication config class
 * @param Routes
 */
import ApplicationConfig from "./config/app.conf.js";

/**
 * @description Swagger UI npm module
 * @param Routes
 */
import swaggerUi from "swagger-ui-express";

/**
 * @description Swagger Documnet
 * @param Routes
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const SwaggerUiDoc = require("./src/swagger.json");

/**
 * @description Create application with Express Framework
 * @param app
 */
const app = express();

app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(SwaggerUiDoc));

/**
 * @description Create application server
 * @param server
 */
const server = http.createServer(app);

/**
 * @description Configure Database
 */
DBConfig.init();

/**
 * @description Configure Application
 */
ApplicationConfig.init(app);

/**
 * @description Configure Routes
 */
initRoutes(app);

/**
 * @function startServer
 * @description Start API Server
 */
const startServer = () => {
  server.listen(process.env.PORT, process.env.IP, () => {
    console.log(
      "Express server listening on %s:%s in %s mode",
      process.env.IP,
      process.env.PORT,
      process.env.NODE_ENV
    );
  });
};

/**
 * @description Starting API Server after everythin is set up
 */
setImmediate(startServer);

/**
 * @description Application object
 * @module app
 */
// module.exports = app;
export default app;
