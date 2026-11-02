import {loadStudyLessons} from '@/lib/study';
export const dynamic='force-dynamic';
export async function GET(){
 return Response.json(await loadStudyLessons(),{headers:{'Cache-Control':'no-store'}});
}
