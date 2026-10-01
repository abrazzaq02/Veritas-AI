import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema";

// Connection is configured automatically by Netlify Database.
// Migrations in netlify/database/migrations are applied by the platform at deploy time.
export const db = drizzle({ schema });
