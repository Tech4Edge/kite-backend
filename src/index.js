import dotenv from "dotenv";
import app from "./app.js";
import { connectToDatabase } from "./utils/db.js";

dotenv.config();

const port = process.env.PORT || 5000;

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

export default app;
