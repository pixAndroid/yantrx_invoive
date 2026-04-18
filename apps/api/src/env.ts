/**
 * Environment loader — MUST be the very first import in index.ts.
 *
 * TypeScript/CommonJS hoists all `import` statements to the top of the
 * compiled file.  By placing the dotenv calls at the module level here,
 * they run synchronously the moment this module is `require()`-d — before
 * any other module (e.g. Prisma) tries to read process.env.
 *
 * Load order:
 *   1. Workspace root .env  (created by the user from .env.example)
 *   2. apps/api/.env         (optional local overrides, takes precedence)
 */
import path from 'path';
import dotenv from 'dotenv';

// Root .env — two directories above apps/api/src/
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
// Local override (apps/api/.env) — optional, takes precedence
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
