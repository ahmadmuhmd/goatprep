import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blueprint,sizes} from '../scripts/blueprint.mjs';
import {validate} from '../scripts/validate.mjs';
function fixture(){return blueprint(1).map(({format,...s})=>({...s,passage:'Original passage for '+s.id,prompt:'Which result follows for '+s.id+'?',options:format==='mcq'?['A','B','C','D'].map((letter,i)=>({letter,text:'Choice '+(i+1)})):[],answer:[format==='mcq'?'B':'0.75'],explanation:'A complete independently checked explanation of this question.',audit_passed:true,reviewed:true}));}
test('All 18 test blueprints have exact sizes and unique slots',()=>{for(let n=1;n<=18;n++){const p=blueprint(n);assert.equal(p.length,147);assert.equal(new Set(p.map(q=>q.id)).size,147);for(const [m,size]of Object.entries(sizes)){assert.equal(p.filter(q=>q.module===m).length,size);assert.equal(p.filter(q=>q.module===m&&!q.scored).length,2);}}});
test('Both R&W branches match operational domain targets',()=>{for(const branch of ['easy','hard']){const p=blueprint(1).filter(q=>q.scored&&(q.module==='rw1'||q.module==='rw2'+branch));assert.deepEqual(['Craft and Structure','Information and Ideas','Standard English Conventions','Expression of Ideas'].map(d=>p.filter(q=>q.domain===d).length),[14,13,13,10]);}});
test('Complete reviewed fixture is accepted',()=>assert.deepEqual(validate(fixture(),{reviewed:true}),[]));
test('Missing questions, duplicate IDs and changed blueprint are rejected',()=>{const b=fixture();b.pop();b[1].id=b[0].id;b[2].domain='Wrong';const errors=validate(b);assert(errors.some(e=>e.includes('Missing slot')));assert(errors.some(e=>e.includes('Duplicate ID')));assert(errors.some(e=>e.includes('Blueprint mismatch')));});
test('Publishing rejects unreviewed and invalid multiple choice content',()=>{const b=fixture();b[0].reviewed=false;b[1].answer=['Z'];const e=validate(b,{reviewed:true});assert(e.some(e=>e.includes('review')));assert(e.some(e=>e.includes('options/key')));});
