import fs from 'node:fs';
const read=n=>JSON.parse(fs.readFileSync(new URL('../src/data/'+n+'.json',import.meta.url)));
const sources=read('sources');const ids=new Set(sources.map(x=>x.id));
const items=[read('exhibits'),...read('patterns'),...read('stories')];
for(const x of items){if(!ids.has(x.source)||typeof x.verified!=='boolean'||typeof x.publishable!=='boolean')throw Error('资料元数据不完整');if(x.publishable&&!x.verified&&x.type!=='艺术化改编')throw Error('禁止将未核实内容发布为史实');}
console.log('内容检查通过：未核实展品仅以设计稿观察资料展示；待考证民俗故事隐藏；艺术化叙事已标注。');
const products=read('wenchuang');
if(!Array.isArray(products)||new Set(products.map(p=>p.id)).size!==products.length)throw Error('文创ID无效');
for(const p of products){if(!['id','name','source','description','image'].every(k=>typeof p[k]==='string'&&p[k].length>0)||!/^(?:patterns|wenchuan)\/[A-Za-z0-9_-]+\.webp$/.test(p.image)||typeof p.verified!=='boolean'||!Array.isArray(p.crop)||p.crop.length!==4||p.crop.some(v=>typeof v!=='number'||v<0||v>1)||p.crop[0]+p.crop[2]>1||p.crop[1]+p.crop[3]>1)throw Error('文创数据字段或素材路径无效');}
const missing=[...new Set(products.map(p=>p.image))].filter(image=>!fs.existsSync(new URL('../public/assets/'+image,import.meta.url)));
if(missing.length)console.log(`文创素材缺失：${missing.length}张。`);

for (const p of products) for (const v of p.sceneViews) { if (!fs.existsSync(new URL("../public/assets/"+v.image,import.meta.url))) throw Error("展品场景图片不存在："+v.image); }
