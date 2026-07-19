/**
 * ESM-safe env loader. Import this as the VERY FIRST import in index.ts.
 * In ESM all static imports are hoisted above module code, so dotenv.config()
 * called inside index.ts body runs too late — the Supabase client initialises
 * before it gets a chance to read the .env file.  Putting the config call
 * inside its own module and importing it first guarantees it evaluates before
 * any other module that reads process.env.
 */
import dotenv from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath }    from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(dir, '.env'), override: true })
