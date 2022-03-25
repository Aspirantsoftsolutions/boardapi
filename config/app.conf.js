import logger from "morgan";
import helmet from "helmet";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

export default class ApplicationConfig {
  static init(app) {
    // app.use(express.static(_root + _nodeModules));
    // app.use(bodyParser.json());
    // app.use(morgan('dev'));
    // app.use(contentLength.validateMax({max: 999}));

    //don't show the log when it is test
    if (process.env.NODE_ENV !== "test") {
      app.use(logger("dev"));
    }
    app.use(helmet());
    app.use(express.json());
    app.use(
      express.urlencoded({
        extended: false,
      })
    );
    app.use(cookieParser());
    // app.use(express.static(path.join(__dirname, "public")));

    //To allow cross-origin requests
    app.use(cors());
  }
}

