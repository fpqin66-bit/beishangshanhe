import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const products: {name: string; photos: string[]}[] = JSON.parse(fs.readFileSync('src/data/wenchuang.json','utf8'));
test.use({launchOptions:{executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']}});
test('repository photos decode, retain RGB through masking, and every catalogue item loads', async ({page}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && /Shader Error/.test(m.text())) errors.push(m.text()); });
  const missing: string[] = [];
  page.on('response', r => { if (r.url().includes('/wenchuan/') && r.status() >= 400) missing.push(r.url()); });
  await page.goto('/?mode=3d&zone=4');
  const g = page.getByRole('region', {name:'第一人称3D展厅'});
  await expect(g.locator('.gallery-loading')).toHaveCount(0, {timeout:45000});
  await expect(g.locator('.island-item-label small')).toHaveCount(0, {timeout:45000});
  const integrity = await page.evaluate(async () => {
    const {photoCanvas} = await import('/src/components/FirstPersonGallery/photoCutout.ts');
    const im = new Image(); im.src = '/assets/wenchuan/fanbudai1.webp'; await im.decode();
    const original = photoCanvas(im, [0,0,1,1],0,false);
    const cutout = photoCanvas(im,[0,0,1,1],0,true,[[.5,.2]]);
    const before = original.getContext('2d')!.getImageData(0,0,original.width,original.height).data;
    const after = cutout.getContext('2d')!.getImageData(0,0,cutout.width,cutout.height).data;
    let transparent=0, retained=0, changed=0;
    for(let i=0;i<after.length;i+=4){
      if(after[i+3]===0)transparent++;
      else {retained++;if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])changed++;}
    }
    return {transparent,retained,changed};
  });
  expect(integrity.changed).toBe(0); expect(integrity.transparent).toBeGreaterThan(10000); expect(integrity.retained).toBeGreaterThan(10000);
  await g.getByRole('button',{name:'浏览岛台文创'}).click();
  const d=page.getByRole('dialog');
  for(const p of products){
    await d.getByRole('button',{name:p.name,exact:true}).click();
    await expect.poll(()=>d.locator('.wenchuang-large-image img').evaluate(async (im:HTMLImageElement)=>{await im.decode();return im.naturalWidth>0;})).toBe(true);
    if(p.photos.length>1){
      await d.getByRole('button',{name:'查看原图2',exact:true}).click();
      await expect.poll(()=>d.locator('.wenchuang-large-image img').evaluate(async (im:HTMLImageElement)=>{await im.decode();return im.naturalWidth>0;})).toBe(true);
    }
  }
  await page.keyboard.press('Escape');
  await page.screenshot({path:'/tmp/real-product-gallery.png'});
  expect(missing).toEqual([]); expect(errors).toEqual([]);
});
