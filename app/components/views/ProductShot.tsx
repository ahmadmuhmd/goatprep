/** Static preview of the test screen for the landing page. */
export default function ProductShot() {
 const opts = ['enhance', 'hinder', 'misrepresent', 'aggravate'];
 return <div className="shot" aria-hidden>
  <div className="shot-win">
   <div className="shot-head"><span>Section 1, Module 1: Reading and Writing</span><b>31:39</b><span className="shot-tools">Highlights &amp; Notes · More</span></div>
   <div className="shot-dash"/>
   <div className="shot-body">
    <p className="shot-pass">Although critics believed that customers would never agree to pay to pick their own produce on farms, such concerns didn&rsquo;t <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u> Booker T. Whatley&rsquo;s efforts to promote the practice.</p>
    <div className="shot-q">
     <div className="shot-qh"><i>4</i> Mark for Review</div>
     <p>Which choice completes the text with the most logical and precise word or phrase?</p>
     {opts.map((o, i) => <div key={o} className={'shot-opt' + (i === 1 ? ' sel' : '') + (i === 2 ? ' out' : '')}><span>{'ABCD'[i]}</span>{o}</div>)}
    </div>
   </div>
   <div className="shot-foot"><span>Question 4 of 27</span><em>Next</em></div>
  </div>
 </div>;
}
