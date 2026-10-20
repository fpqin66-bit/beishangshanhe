import {useEffect,useRef,useState} from 'react';
import products from '../data/wenchuang.json';

/** Recolour the photograph's dark fabric, keeping coloured embroidery and highlights. */
export default function ProductPhoto({product,color}:{product:typeof products[number];color:string}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const [status,setStatus]=useState('loading');
 useEffect(()=>{
  let active=true;
  setStatus('loading');
  const image=new Image();
  image.onload=()=>{
   if(!active||!canvas.current)return;
   const crop=product.detailCrop||[0,0,1,1];
   const width=image.naturalWidth*crop[2],height=image.naturalHeight*crop[3];
   const scale=Math.min(1,1000/Math.max(width,height));
   const target=canvas.current;target.width=Math.round(width*scale);target.height=Math.round(height*scale);
   const ctx=target.getContext('2d',{willReadFrequently:true})!;
   ctx.drawImage(image,image.naturalWidth*crop[0],image.naturalHeight*crop[1],width,height,0,0,target.width,target.height);
   const pixels=ctx.getImageData(0,0,target.width,target.height);
   const tint=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
   for(let i=0;i<pixels.data.length;i+=4){
    const [r,g,b]=pixels.data.slice(i,i+3);
    const high=Math.max(r,g,b),low=Math.min(r,g,b);
    const y=Math.floor(i/4/target.width)/target.height;
    // Dolls keep their face and hair; only red clothing below the shoulders changes.
    const clothing=product.id==='doll'&&y>.45&&r>g*1.65&&r>b*1.5;
    const neutral=product.id!=='doll'&&high<125&&(high-low)<32;
    if(!neutral&&!clothing)continue;
    const amount=clothing?Math.min(1,(r-g)/70):Math.min(1,(125-high)/35)*Math.min(1,(32-high+low)/12);
    const light=clothing?Math.max(.35,r/155):.45+(r+g+b)/3/100;
    for(let c=0;c<3;c++)pixels.data[i+c]=pixels.data[i+c]*(1-amount)+Math.min(255,tint[c]*light)*amount;
   }
   ctx.putImageData(pixels,0,0);setStatus('ready');
  };
  image.onerror=()=>{if(active)setStatus('error');};
  image.src=(window as Window & {__EXHIBITION_ASSETS__?:Record<string,string>}).__EXHIBITION_ASSETS__?.[product.image]||'./assets/'+product.image;
  return()=>{active=false;};
 },[product,color]);
 return <div className="product-photo" data-status={status}>
  <canvas ref={canvas} role="img" aria-label={product.name+'实物图片配色预览'} style={{visibility:status==='ready'?'visible':'hidden'}}/>
  {status==='loading'&&<span>正在加载实物图片…</span>}
  {status==='error'&&<span role="alert">图片加载失败，请刷新页面重试。</span>}
 </div>;
}
