import type {Metadata} from 'next';
import './globals.css';
import './light-theme.css';
import './editorial.css';
export const metadata:Metadata={title:'GOATPrep — Free forever.',description:'Free digital SAT preparation: Reading and Writing, Math, adaptive practice tests, and progress tracking.',icons:{icon:'/goat-logo.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{__html:`try{document.documentElement.dataset.theme=localStorage.getItem('goatprep-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`}}/>{children}</body></html>;}

import './solid-theme.css';

import './signature-theme.css';

import './themes.css';
