import type {Metadata, Viewport} from 'next';
import './globals.css';
import './light-theme.css';
import './editorial.css';
export const metadata:Metadata={title:'GOATPrep — Digital SAT Prep',applicationName:'GOATPrep',description:'Digital SAT preparation with Reading and Writing, Math, adaptive practice tests, and progress tracking. Free to use; no subscription required.',icons:{icon:'/icon-512.png',apple:'/icon-192.png'},appleWebApp:{capable:true,title:'GOATPrep',statusBarStyle:'default'}};
export const viewport:Viewport={themeColor:'#7628ED',colorScheme:'light dark'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{__html:`try{document.documentElement.dataset.theme=localStorage.getItem('goatprep-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`}}/>{children}</body></html>;}

import './solid-theme.css';

import './signature-theme.css';

import './themes.css';
