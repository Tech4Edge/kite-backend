import dotenv from "dotenv";

const nodeEnv = process.env.NODE_ENV || "development";

// Load a stack of env files so local/dev/prod can be configured without code edits.
dotenv.config({ path: `.env.${nodeEnv}.local`, override: false });
dotenv.config({ path: `.env.${nodeEnv}`, override: false });
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env", override: false });
