import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const assets={};
const used=new Set(['exhibits','patterns','stories'].flatMap(n=>[...fs.readFileSync('src/data/'+n+'.json','utf8').matchAll(/\"([^\"]+\.webp)\"/g)].map(m=>m[1])));
for(const file of fs.readdirSync(path.join(root,'assets'))){
 if(used.has(file)) assets[file]='data:image/webp;base64,'+fs.readFileSync(path.join(root,'assets',file)).toString('base64');
}
let code='';
html=html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,(_,file)=>{code+=fs.readFileSync(path.join(root,file),'utf8');return '';});
html=html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,(_,file)=>'<style>'+fs.readFileSync(path.join(root,file),'utf8')+'</style>');
const safe=code.replace(/<\/script/gi,'<\\/script');
html=html.replace('</body>',()=>'<script>window.__EXHIBITION_ASSETS__='+JSON.stringify(assets)+';</script><script>'+safe+'</script></body>');
fs.writeFileSync(path.join(root,'背上的山河-独立展览.html'),html);
console.log('独立HTML已生成：全部脚本、样式及图片已内嵌，可离线打开。');
