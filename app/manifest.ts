import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest {
  return {
    name:'GOATPrep — Digital SAT Prep',
    short_name:'GOATPrep',
    description:'Free Digital SAT practice: Bluebook-style adaptive tests, lessons, daily questions and words.',
    start_url:'/',
    scope:'/',
    display:'standalone',
    background_color:'#FAF7F0',
    theme_color:'#127A4E',
    icons:[
      {src:'/icon-192.png',sizes:'192x192',type:'image/png'},
      {src:'/icon-512.png',sizes:'512x512',type:'image/png'},
    ],
  };
}
