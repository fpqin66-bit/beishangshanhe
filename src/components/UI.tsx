import {useEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import ImageExplorer from './ImageExplorer';
import {X,ArrowUpRight} from 'lucide-react';
export function Photo({name,alt,className=''}:{name:string;alt:string;className?:string}){
 const [open,setOpen]=useState(false);const ref=useRef<HTMLImageElement>(null);
 const src=(window as Window & {__EXHIBITION_ASSETS__?:Record<string,string>}).__EXHIBITION_ASSETS__?.[name]||'./assets/'+name;
 useEffect(()=>{const img=ref.current;if(img&&!img.closest('button,a')){img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label','放大查看：'+alt);img.classList.add('explorable-photo');}},[alt]);
 return <><img ref={ref} className={className} src={src} alt={alt} loading="lazy" onClick={e=>{if(!e.currentTarget.closest('button,a'))setOpen(true);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){if(!e.currentTarget.closest('button,a')){e.preventDefault();setOpen(true);}}}} onError={e=>{e.currentTarget.hidden=true;const p=e.currentTarget.parentElement;if(p)p.dataset.imageError='图像暂不可用 · '+alt;}}/>{open&&createPortal(<Modal title={alt} onClose={()=>setOpen(false)}><ImageExplorer src={src} alt={alt}/></Modal>,document.body)}</>;
}
export function Heading({no,en,title,sub}:{no:string;en:string;title:string;sub:string}){
 const [saved,setSaved]=useState(()=>{try{return localStorage.getItem('exhibition-chapter-'+no)==='saved';}catch{return false;}});
 function toggle(){setSaved(!saved);try{if(saved)localStorage.removeItem('exhibition-chapter-'+no);else localStorage.setItem('exhibition-chapter-'+no,'saved');}catch{/* Private browsing still allows an in-page collection. */}}
 return <div className="chapter-heading reveal"><div className="eyebrow"><span>{no}</span> / {en}</div><div className="chapter-title-row"><h2>{title}</h2><button className={'chapter-bookmark '+(saved?'saved':'')} aria-pressed={saved} onClick={toggle}>{saved?'✓ 已收藏本幕':'＋ 收藏本幕'}</button></div><p>{sub}</p><span className="sr-only" role="status">{saved?'这一幕已收入你的参观手记':''}</span></div>;
}
export function ReadingNote({title='阅读背后的故事',children}:{title?:string;children:ReactNode}){return <details className="reading-note"><summary>{title}<span aria-hidden="true">＋</span></summary><div>{children}</div></details>;}
export function LinkArrow(){return <ArrowUpRight size={18}/>}
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const last=document.activeElement as HTMLElement;const d=ref.current!;d.showModal();return()=>{d.close();last?.focus();}},[]);return <dialog ref={ref} className="modal" onCancel={e=>{e.preventDefault();e.stopPropagation();onClose();}} onClick={e=>{e.stopPropagation();if(e.target===e.currentTarget)onClose();}}><div className="modal-inner"><div className="modal-top"><span className="eyebrow">THE EXHIBITION / 展览档案</span><button className="icon-button" onClick={onClose} aria-label="关闭弹窗"><X/></button></div><h2>{title}</h2>{children}</div></dialog>}
export function Ornament({variant=0}:{variant?:number}){return <svg viewBox="0 0 400 400" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1.4"><path d="M200 28 372 200 200 372 28 200Z"/><path d="M200 45 355 200 200 355 45 200Z"/>{Array.from({length:8},(_,i)=><g key={i} transform={'rotate('+i*45+' 200 200)'}><path d={variant===1?'M200 200Q125 110 200 64Q275 110 200 200Z':variant===2?'M200 200 160 125 200 85 240 125Z':'M200 200C112 153 137 63 200 83C263 63 288 153 200 200Z'}/><path d="M200 172V103M190 130 200 143 210 130"/><circle cx="200" cy="62" r="4"/></g>)}<circle cx="200" cy="200" r="27"/><circle cx="200" cy="200" r="18"/><path d="m200 188 12 12-12 12-12-12Z"/></g></svg>}
