import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const products: {name:string;model:string}[]=JSON.parse(fs.readFileSync('src/data/wenchuang.json','utf8'));
test('all nine products customize, keep text, show references, and export the selected design',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:1250});await page.goto('/');
  const section=page.locator('#chapter-4');await section.scrollIntoViewIfNeeded();
  const picker=section.getByRole('group',{name:'选择定制物品'});
  await expect(picker.getByRole('button')).toHaveCount(10);
  for(const product of products){
    await picker.getByRole('button',{name:product.name,exact:true}).click();
    await expect(section.locator('.custom-product-svg')).toBeVisible();
    await section.getByRole('button',{name:'靛青',exact:true}).click();
    await section.getByRole('button',{name:'山川',exact:true}).click();
    await expect(section.locator('.custom-product-svg')).toHaveAttribute('data-color','#405766');
    await expect(section.locator('.custom-product-svg')).toHaveAttribute('data-pattern','2');
  }
  await section.getByPlaceholder('写下你的祝福').fill('愿你一路繁花');
  await picker.getByRole('button',{name:'花卉纹帆布袋',exact:true}).click();
  await expect(section.locator('.custom-product-svg')).toContainText('愿你一路繁花');
  await page.screenshot({path:'/tmp/custom-products-desktop.png'});
  await section.getByRole('button',{name:'查看原始文创图片'}).click();
  const dialog=page.getByRole('dialog');
  await expect.poll(()=>dialog.locator('img').evaluate(async(im:HTMLImageElement)=>{await im.decode();return im.naturalWidth>0;})).toBe(true);
  await page.keyboard.press('Escape');
  const firstDownload=page.waitForEvent('download');await section.getByRole('button',{name:'保存我的文创设计',exact:true}).click();
  const first=await firstDownload;expect(first.suggestedFilename()).toContain('帆布袋');const firstBytes=fs.readFileSync((await first.path())!);
  expect([firstBytes.readUInt32BE(16),firstBytes.readUInt32BE(20)]).toEqual([1200,1600]);
  await section.getByRole('button',{name:'绛红',exact:true}).click();await section.getByRole('button',{name:'繁花',exact:true}).click();
  const secondDownload=page.waitForEvent('download');await section.getByRole('button',{name:'保存我的文创设计',exact:true}).click();
  expect(fs.readFileSync((await (await secondDownload).path())!).equals(firstBytes)).toBe(false);
  await picker.getByRole('button',{name:'数字祝福卡',exact:true}).click();await expect(section.locator('.card-border p')).toHaveText('愿你一路繁花');
  expect(errors).toEqual([]);
});
test('custom products work offline and fit mobile width',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.context().setOffline(true);
  await page.setContent(fs.readFileSync('dist/exhibition-preview.html','utf8'));
  const section=page.locator('#chapter-4');await section.scrollIntoViewIfNeeded();
  await section.getByRole('group',{name:'选择定制物品'}).getByRole('button',{name:'花语随行杯',exact:true}).click();
  await section.getByRole('button',{name:'茶褐',exact:true}).click();await expect(section.locator('.custom-product-svg')).toHaveAttribute('data-color','#655043');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await section.getByRole('button',{name:'查看原始文创图片'}).click();
  await expect.poll(()=>page.getByRole('dialog').locator('img').evaluate(async(im:HTMLImageElement)=>{await im.decode();return im.naturalWidth>0;})).toBe(true);
});
