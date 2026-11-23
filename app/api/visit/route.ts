import {neonSQL} from '@/lib/neon-database.mjs';

const PATHS = new Set(['home', 'study', 'words', 'practice', 'daily', 'jerry', 'me', 'reviews', 'admin', 'test']);

/** Anonymous page-view counter for the Admin Center. Stores a random browser id, never an IP address. */
export async function POST(request: Request) {
 try {
  const body = await request.json();
  const visitor = typeof body.visitor === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(body.visitor) ? body.visitor : null;
  const path = typeof body.path === 'string' && PATHS.has(body.path) ? body.path : null;
  if (!visitor || !path) return Response.json({ok: false}, {status: 400});
  // The same browser opening the same page again within 30 seconds counts once.
  await neonSQL().query(
   `INSERT INTO public.site_visits (visitor, path, signed_in)
    SELECT $1, $2, $3 WHERE NOT EXISTS (
     SELECT 1 FROM public.site_visits WHERE visitor = $1 AND path = $2 AND created_at > now() - interval '30 seconds')`,
   [visitor, path, body.signedIn === true]);
  return Response.json({ok: true});
 } catch {
  return Response.json({ok: false}, {status: 202});
 }
}
