const { test, expect } = require('playwright/test');

test('test flow reaches result screen', async ({ page }) => {
  await page.goto('http://127.0.0.1:3100/');
  await expect(page.getByRole('link', { name: /테스트 시작하기/ })).toBeVisible();
  await page.getByRole('link', { name: /테스트 시작하기/ }).click();
  await expect(page).toHaveURL(/\/test$/);

  for (let i = 0; i < 15; i += 1) {
    const firstChoice = page.locator('button.choice-button').first();
    await expect(firstChoice).toBeVisible();
    await firstChoice.click();
  }

  await expect(page).toHaveURL(/\/result\?/);
  await expect(page.getByText('AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.')).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'artifacts/result-flow-mobile.png', fullPage: true });
});
