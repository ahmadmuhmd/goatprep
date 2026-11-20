import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest {
  return {
    name:'GOATPrep — Digital SAT Prep',
    short_name:'GOATPrep',
    description:'Digital SAT preparation with lessons and adaptive practice tests.',
    start_url:'/',
    scope:'/',
    display:'standalone',
    background_color:'#FFFFFF',
    theme_color:'#7628ED',
    icons:[
      {src:'/icon-192.png',sizes:'192x192',type:'image/png'},
      {src:'/icon-512.png',sizes:'512x512',type:'image/png'},
    ],
  };
}
