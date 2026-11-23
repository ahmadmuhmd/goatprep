import {authenticated, failure, isAdmin} from '@/lib/server';
import {adminStats} from '@/lib/admin-stats';

/** Admin Center data. Only emails listed in ADMIN_EMAILS get anything back. */
export async function GET(request: Request) {
 try {
  const {user} = await authenticated(request);
  if (!isAdmin(user.email)) return failure(new Error('Admin access required.'), 403);
  const stats = await adminStats().catch(() => null);
  if (!stats) return failure(new Error('Could not load the stats. Check the database connection.'), 500);
  return Response.json(stats, {headers: {'Cache-Control': 'no-store'}});
 } catch (e) {return failure(e, 401);}
}
