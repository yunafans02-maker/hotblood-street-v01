import {test,expect} from '@playwright/test';

test('web delivery serves HTML and assets inline, then renders the game', async({page})=>{
 const errors=[],assets=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(/\/assets\/.*\.(js|css)(\?|$)/.test(r.url()))assets.push(r);});
 const response=await page.goto('/');
 expect(response.status()).toBe(200);
 expect(response.headers()['content-type']).toContain('text/html');
 expect(response.headers()['content-disposition']||'').not.toContain('attachment');
 await expect(page.locator('#boot-status')).toHaveCount(0);
 await expect(page.locator('canvas')).toBeVisible();
 expect(await page.evaluate(()=>window.__game)).toBeUndefined();
 for(const r of assets){expect(r.status()).toBe(200);expect(r.headers()['content-disposition']||'').not.toContain('attachment');expect(r.headers()['content-type']).toMatch(/javascript|css/);}
 expect(errors).toEqual([]);
});

test('failed game bundle offers a reload action instead of an unexplained black screen', async({page})=>{
 await page.route(/\/(assets\/.*\.js|src\/main\.ts)(\?|$)/,route=>route.abort('failed'));
 await page.goto('/');
 await expect(page.locator('#boot-status')).toBeVisible();
 await expect(page.locator('#boot-retry')).toBeVisible();
 await expect(page.locator('#boot-message')).toContainText('載入未完成');
 await page.unrouteAll();
 await page.locator('#boot-retry').click();
 await expect(page.locator('#boot-status')).toHaveCount(0);
 await expect(page.locator('canvas')).toBeVisible();
});
