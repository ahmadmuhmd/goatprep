import type {Metadata, Viewport} from 'next';
import localFont from 'next/font/local';
import 'katex/dist/katex.min.css';
import './globals.css';
import './exam.css';

const display = localFont({
 src: [
  {path: './fonts/fraunces-latin-400-normal.woff2', weight: '400', style: 'normal'},
  {path: './fonts/fraunces-latin-400-italic.woff2', weight: '400', style: 'italic'},
  {path: './fonts/fraunces-latin-500-normal.woff2', weight: '500', style: 'normal'},
  {path: './fonts/fraunces-latin-500-italic.woff2', weight: '500', style: 'italic'},
  {path: './fonts/fraunces-latin-600-normal.woff2', weight: '600', style: 'normal'},
  {path: './fonts/fraunces-latin-600-italic.woff2', weight: '600', style: 'italic'},
  {path: './fonts/fraunces-latin-700-normal.woff2', weight: '700', style: 'normal'},
  {path: './fonts/fraunces-latin-800-normal.woff2', weight: '800', style: 'normal'},
 ],
 variable: '--font-display', display: 'swap',
});
const body = localFont({
 src: [
  {path: './fonts/atkinson-hyperlegible-next-latin-400-normal.woff2', weight: '400', style: 'normal'},
  {path: './fonts/atkinson-hyperlegible-next-latin-500-normal.woff2', weight: '500', style: 'normal'},
  {path: './fonts/atkinson-hyperlegible-next-latin-600-normal.woff2', weight: '600', style: 'normal'},
  {path: './fonts/atkinson-hyperlegible-next-latin-700-normal.woff2', weight: '700', style: 'normal'},
  {path: './fonts/atkinson-hyperlegible-next-latin-800-normal.woff2', weight: '800', style: 'normal'},
 ],
 variable: '--font-body', display: 'swap',
});
// Test-day fonts: Bluebook uses a Roboto-style interface and a Noto-Serif-style reading face.
const examSans = localFont({
 src: [
  {path: './fonts/roboto-latin-400-normal.woff2', weight: '400', style: 'normal'},
  {path: './fonts/roboto-latin-500-normal.woff2', weight: '500', style: 'normal'},
  {path: './fonts/roboto-latin-700-normal.woff2', weight: '700', style: 'normal'},
 ],
 variable: '--font-exam-sans', display: 'swap',
});
const examSerif = localFont({
 src: [
  {path: './fonts/noto-serif-latin-400-normal.woff2', weight: '400', style: 'normal'},
  {path: './fonts/noto-serif-latin-400-italic.woff2', weight: '400', style: 'italic'},
  {path: './fonts/noto-serif-latin-700-normal.woff2', weight: '700', style: 'normal'},
  {path: './fonts/noto-serif-latin-700-italic.woff2', weight: '700', style: 'italic'},
 ],
 variable: '--font-exam-serif', display: 'swap',
});

export const metadata: Metadata = {
 title: 'GOATPrep — Digital SAT practice',
 applicationName: 'GOATPrep',
 description: 'Free Digital SAT practice: 12 adaptive Bluebook-style tests, lessons, daily questions and vocabulary.',
 icons: {icon: '/favicon.ico', apple: '/apple-icon.png'},
 appleWebApp: {capable: true, title: 'GOATPrep', statusBarStyle: 'default'},
};
export const viewport: Viewport = {
 themeColor: [{media: '(prefers-color-scheme: light)', color: '#FAF7F0'}, {media: '(prefers-color-scheme: dark)', color: '#121311'}],
 colorScheme: 'light dark',
};

const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('goatprep-theme')||'dark'}catch{}`;

export default function RootLayout({children}: {children: React.ReactNode}) {
 return <html lang="en" suppressHydrationWarning className={[display.variable, body.variable, examSans.variable, examSerif.variable].join(' ')}>
  <body><script dangerouslySetInnerHTML={{__html: themeScript}}/>{children}</body>
 </html>;
}
