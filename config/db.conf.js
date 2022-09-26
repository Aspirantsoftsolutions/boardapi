import mongoose from "mongoose";
import bluebird from "bluebird";

mongoose.Promise = bluebird;

/**
 * Database setup and configurations
 */
export default class DBConfig {
  static init() {
    const MONGODB_URL = process.env.MONGODB_URL;
    mongoose
      .connect(MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName:'streamboard'
      })
      .then(() => {
        //don't show the log when it is test
        if (process.env.NODE_ENV !== "test") {
          console.log("Connected to %s", MONGODB_URL);
          console.log("App is running ... \n");
          console.log("Press CTRL + C to stop the process. \n");
        }
      })
      .catch((err) => {
        console.error("App starting error:", err.message);
        process.exit(1);
      });
  }
}
