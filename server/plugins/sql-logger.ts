import { initSqlLogging } from "../utils/sql-logger.ts";

export default defineNitroPlugin(() => {
  initSqlLogging();
});
