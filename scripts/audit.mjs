import fs from 'node:fs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../src/data/'+n+'.json',import.meta.url)));
const sources=read('sources');const ids=new Set(sources.map(x=>x.id));
const items=[read('exhibits'),...read('patterns'),...read('stories')];
for(const x of items){if(!ids.has(x.source)||typeof x.verified!=='boolean'||typeof x.publishable!=='boolean')throw Error('资料元数据不完整');if(x.publishable&&!x.verified&&x.type!=='艺术化改编')throw Error('禁止将未核实内容发布为史实');}
console.log('内容检查通过：未核实展品仅以设计稿观察资料展示；待考证民俗故事隐藏；艺术化叙事已标注。');
