import {useRef,useState} from 'react';
import {Download,RotateCcw,Check,ArrowUpRight} from 'lucide-react';
import {Heading,Ornament,Photo,Modal} from '../components/UI';
import products from '../data/wenchuang.json';
import ProductPhoto from '../components/ProductPhoto';
import '../styles/custom-products.css';
const colors=[{name:'绛红',color:'#783b42'},{name:'靛青',color:'#405766'},{name:'茶褐',color:'#655043'}];
export default function Blessing({sources}:{sources:()=>void}){
 const [color,setColor]=useState(0),[pattern,setPattern]=useState(0),[text,setText]=useState('愿你所行，皆有繁花'),[saved,setSaved]=useState(false);
 const [productId,setProductId]=useState('cup'),[reference,setReference]=useState(false);
 const motif=useRef<HTMLDivElement>(null);
 const product=products.find(p=>p.id===productId)!;
 async function download(){setSaved(false);const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1600;const c=canvas.getContext('2d')!;c.fillStyle=colors[color].color;c.fillRect(0,0,1200,1600);c.strokeStyle='#c6a36a';c.lineWidth=2;c.strokeRect(60,60,1080,1480);c.strokeRect(78,78,1044,1444);c.fillStyle='#f0e5d1';c.textAlign='center';c.font='22px serif';c.fillText('THE MOUNTAINS WE CARRY',600,170);c.font='70px serif';c.fillText('背上的山河',600,285);const svg=motif.current!.querySelector('svg')!.cloneNode(true) as SVGElement;svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','650');svg.setAttribute('height','650');svg.setAttribute('style','color:#d5b783');const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'});const url=URL.createObjectURL(blob);const im=new Image();try{await new Promise<void>((resolve,reject)=>{im.onload=()=>resolve();im.onerror=reject;im.src=url;});c.drawImage(im,275,380,650,650);c.font='46px KaiTi, STKaiti, cursive';const chars=Array.from(text||'愿你所行，皆有繁花');const rows=[chars.slice(0,10).join(''),chars.slice(10).join('')].filter(Boolean);rows.forEach((row,i)=>c.fillText(row,600,1170+i*65));c.font='21px serif';c.fillStyle='#decdb0';c.fillText('随文创赠予你的一份心意',600,1420);c.fillText('背上的山河 · 专属祝福卡',600,1470);const png=await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/png'));if(!png)throw Error('export');const link=document.createElement('a');link.href=URL.createObjectURL(png);link.download='背上的山河-数字祝福卡.png';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),5000);setSaved(true);}catch{alert('导出暂未完成，请重试。');}finally{URL.revokeObjectURL(url);}}
 return <section id="chapter-4" className="blessing section">
 <Heading no="04" en="THE BLESSING" title="续 · 把祝福带走" sub="选一件心爱的文创，将一纸祝福带回日常。"/>
 <div className="custom-product-picker" role="group" aria-label="选择定制物品">{products.map(p=><button key={p.id} aria-label={p.name} aria-pressed={productId===p.id} className={productId===p.id?'selected':''} onClick={()=>{setProductId(p.id);setSaved(false);}}><Photo name={p.image} alt={p.name}/><span>{p.name}</span></button>)}</div>
 <div className="blessing-grid">
 <div className="card-stage"><span className="eyebrow">OBJECTS FOR EVERYDAY POETRY</span><ProductPhoto product={product} color={colors[color].color}/><h3>{product.name}</h3><span className="stage-caption">{colors[color].name} · 实物图片配色预览</span><button className="text-button" onClick={()=>setReference(true)}>查看原始文创图片 <ArrowUpRight size={14}/></button></div>
 <div className="card-tools"><span className="eyebrow">MAKE IT YOURS</span><h3>让心意，有自己的颜色。</h3><p className="product-description">{product.description}</p>
 <fieldset><legend><b>01</b> 选一方底色</legend><div className="swatches">{colors.map((v,i)=><button key={v.name} onClick={()=>{setColor(i);setSaved(false);}} className={color===i?'selected':''} aria-pressed={color===i}><i style={{background:v.color}}/>{v.name}</button>)}</div></fieldset>
 <p className="tool-note">基于实物照片呈现三种配色，颜色为数字预览，以实物为准。</p>
 <div className="gift-intro"><span>随文创赠送 / A GIFT FOR YOU</span><h3>物有所属，字有所寄。</h3><p>每一件文创，都随赠一张专属祝福卡。你的文字只留在卡片上。</p></div>
 <fieldset><legend><b>02</b> 为赠卡选一枚纹样</legend><div className="motif-options">{['繁花','相依','山川'].map((v,i)=><button key={v} className={pattern===i?'selected':''} onClick={()=>{setPattern(i);setSaved(false);}} aria-pressed={pattern===i}><Ornament variant={i}/><span>{v}</span></button>)}</div></fieldset>
 <label className="message-label"><span><b>03</b> 在赠卡上留一句祝福 <small>{Array.from(text).length}/20</small></span><input value={text} onChange={e=>{setText(Array.from(e.target.value).slice(0,20).join(''));setSaved(false);}} placeholder="写下你的祝福"/></label></div></div>
 <div className="gift-card-area"><div className="blessing-card gift-card" style={{background:colors[color].color}}><div className="card-border"><small>A LITTLE WISH, JUST FOR YOU</small><h3>背上的山河</h3><div className="card-motif" ref={motif}><Ornament variant={pattern}/></div><p className="handwritten">{text||'愿你所行，皆有繁花'}</p><span>随文创赠予你的一份心意</span></div></div>
 <div className="gift-actions"><span className="eyebrow">YOUR COMPLIMENTARY CARD</span><h3>一件文创，一纸心意。</h3><p>已为「{product.name}」附上你的专属赠卡。愿这份温柔，陪你走过日常的山河。</p>
 <button className="primary export" onClick={download}>{saved?<Check size={18}/>:<Download size={18}/>} {saved?'已生成，再保存一份':'保存赠送的祝福卡'}</button><span className="stage-caption">高清 PNG · 1200 × 1600</span>
 <div className="card-links"><button onClick={()=>{setColor(0);setPattern(0);setText('愿你所行，皆有繁花');setSaved(false);}}><RotateCcw size={14}/>重新创作</button><button onClick={sources}>查看资料来源 <ArrowUpRight size={14}/></button></div><p className="tool-note" role="status">{saved?'祝福卡已生成，请在浏览器下载记录中查看。':'你的祝福仅保留在当前页面，无需登录。'}</p></div></div>
 {reference&&<Modal title={product.name+' · 原始参考图'} onClose={()=>setReference(false)}><div className="custom-reference"><Photo name={product.image} alt={product.name}/><p>{product.description}</p><p className="disclaimer">{product.source} · verified: {String(product.verified)}</p></div></Modal>}
 </section>;
}
