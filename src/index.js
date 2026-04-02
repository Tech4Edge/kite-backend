import "./config/loadEnv.js";
import app from "./app.js";
import { connectToDatabase } from "./utils/db.js";

const port = process.env.PORT || 5000;
const host = process.env.HOST || "0.0.0.0";

connectToDatabase()
  .then(() => {
    app.listen(port, host, () => {
      console.log(`Server listening on http://${host}:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

export default app;
