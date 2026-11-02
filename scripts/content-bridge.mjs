// Shared blueprint and validation: Python and the app use the same rules.
import fs from 'node:fs';
import {blueprint} from './blueprint.mjs';
import {validate} from './validate.mjs';
const [action,value]=process.argv.slice(2);
if(action==='blueprint') console.log(JSON.stringify(blueprint(Number(value))));
else if(action==='validate') {
 const {bank,complete=false}=JSON.parse(fs.readFileSync(0,'utf8'));
 console.log(JSON.stringify(validate(bank,{complete})));
} else throw new Error('Expected blueprint or validate');
