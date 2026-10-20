import {test,expect} from '@playwright/test';

test('image exploration, chapter collection, reading disclosures and story paging',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:'放大查看：设计稿提供的红黑底花卉刺绣背带图像',exact:true}).click();
 await page.getByRole('slider',{name:'图片放大倍数'}).fill('2');
 await expect(page.locator('.explorer-viewport img')).toHaveCSS('transform','matrix(2, 0, 0, 2, 0, 0)');
 await page.getByRole('button',{name:'还原',exact:true}).click();
 await expect(page.getByRole('slider')).toHaveValue('1');await page.keyboard.press('Escape');
 const chapter=page.locator('#chapter-1');
 await chapter.getByRole('button',{name:'收藏本幕'}).click();await page.reload();
 await expect(chapter.getByRole('button',{name:'已收藏本幕'})).toHaveAttribute('aria-pressed','true');
 const note=chapter.locator('.reading-note').first();await expect(note).not.toHaveAttribute('open');await note.locator('summary').click();await expect(note).toHaveAttribute('open','');
 await page.getByRole('button',{name:'画面下一幕',exact:true}).click();await expect(page.locator('.story-copy h3')).toContainText('手中');
 await page.locator('.pattern-card').first().click();await page.getByRole('button',{name:'花卉',exact:true}).click();await expect(page.locator('.answer')).toContainText('观察得很仔细');
 // A detail photograph opens a second native dialog and restores the first on Escape.
 await page.locator('.detail-image img').click();await expect(page.locator('dialog')).toHaveCount(2);await page.keyboard.press('Escape');await expect(page.locator('dialog')).toHaveCount(1);await page.keyboard.press('Escape');
 expect(errors).toEqual([]);
});

test('product zoom and compact mobile layout',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/#chapter-4');
 await page.locator('.product-photo[data-status="ready"]').waitFor();
 await page.getByRole('button',{name:'放大查看：花语随行杯配色预览'}).click();await expect(page.locator('.image-explorer')).toBeVisible();await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
