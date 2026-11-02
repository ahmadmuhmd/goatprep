import {lessons as foundations} from '@/lib/lessons';
import {database} from '@/lib/server';
import {parseStudyLesson,type StudyLesson} from '@/lib/study-schema';
export async function loadStudyLessons(db?:ReturnType<typeof database>){
 const merged=new Map<string,StudyLesson>(foundations.map(l=>[l.id,l]));
 try{
  const connection=db??database();
  const {data,error}=await connection.from('study_lessons').select('id,payload').eq('published',true).order('sort_order').order('id').limit(500);
  if(error)throw error;
  for(const row of data??[]){
   const lesson=parseStudyLesson(row.payload);
   if(lesson&&lesson.id===row.id)merged.set(lesson.id,lesson);
  }
  return {lessons:[...merged.values()],unavailable:false};
 }catch{return {lessons:[...merged.values()],unavailable:true};}
}
