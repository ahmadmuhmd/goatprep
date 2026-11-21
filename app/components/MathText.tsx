"use client";
import {Fragment, useMemo} from 'react';
import katex from 'katex';

// Render with the same KaTeX version as the stylesheet (react-katex bundles an older one).
function tex(src: string, displayMode: boolean) {
 try {return katex.renderToString(src, {displayMode, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml'});} catch {return null;}
}

export default function MathText({text}: {text: string}) {
 const parts = useMemo(() => (text ?? '').split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g), [text]);
 return <>{parts.map((p, i) => {
  const block = p.startsWith('$$') && p.endsWith('$$') && p.length > 4;
  const inline = !block && p.startsWith('$') && p.endsWith('$') && p.length > 2;
  if (!block && !inline) return <Fragment key={i}>{p}</Fragment>;
  const html = tex(block ? p.slice(2, -2) : p.slice(1, -1), block);
  return html ? <span key={i} className={block ? 'math-block' : 'math-inline'} dangerouslySetInnerHTML={{__html: html}}/> : <Fragment key={i}>{p}</Fragment>;
 })}</>;
}
