const { delay, retry, saveCookies } = require('./utils');

async function isLoggedIn(page) {
  await page.waitForSelector('#login_Layer, .nI-gNb-drawer', { timeout: 10000 }).catch(() => {});
  return await page.locator('#login_Layer').count() === 0;
}

async function login(page, context, EMAIL, PASSWORD, COOKIE_PATH) {

  if (await isLoggedIn(page)) {
    console.log("✅ Already logged in (cookies)");
    return;
  }

  console.log("🔐 Logging in...");

  await page.locator('#login_Layer').click();

  await page.waitForLoadState('domcontentloaded');
  await delay(3000, 5000);

  await page.waitForSelector('input[placeholder*="Email"]', { timeout: 15000 });

  await page.locator('input[placeholder*="Email"]').fill(EMAIL);
  await delay(1000, 2000);

  await page.locator('input[type="password"]').fill(PASSWORD);
  await delay();

  await page.locator('button.loginButton').click();

  await page.waitForLoadState('networkidle');

  console.log("✅ Login completed");

  await saveCookies(context, COOKIE_PATH);
}

module.exports = login;