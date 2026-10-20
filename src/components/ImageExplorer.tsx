import {useState,type PointerEvent} from 'react';

export default function ImageExplorer({src,alt}:{src:string;alt:string}){
 const [zoom,setZoom]=useState(1),[offset,setOffset]=useState({x:0,y:0});
 function drag(e:PointerEvent<HTMLDivElement>){if(e.buttons!==1||zoom===1)return;setOffset(p=>({x:Math.max(-400,Math.min(400,p.x+e.movementX)),y:Math.max(-400,Math.min(400,p.y+e.movementY))}));}
 return <div className="image-explorer">
  <div className="explorer-viewport" onPointerDown={e=>e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={drag}><img draggable={false} src={src} alt={alt} style={{transform:`translate(${offset.x}px,${offset.y}px) scale(${zoom})`}}/></div>
  <div className="explorer-tools"><label>细节放大 <input aria-label="图片放大倍数" type="range" min="1" max="4" step=".1" value={zoom} onChange={e=>{setZoom(Number(e.target.value));setOffset({x:0,y:0});}}/></label><button onClick={()=>{setZoom(1);setOffset({x:0,y:0});}}>还原</button></div>
  <p className="explorer-hint">放大后拖动图片，寻找针线里的细节。</p>
 </div>;
}
