import { z } from "zod";

// Zod's `new Function` probe would otherwise send a CSP report on every page that loads a schema
z.config({ jitless: true });
