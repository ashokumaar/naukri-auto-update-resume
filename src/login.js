const { delay, retry, saveCookies } = require('./utils');

async function isLoggedIn(page) {
  // Wait up to 10s for either the login button or profile drawer to appear
  await page.waitForSelector('#login_Layer, .nI-gNb-drawer', { timeout: 10000 }).catch(() => {});
  // If the login button does NOT exist, we are logged in
  return await page.locator('#login_Layer').count() === 0;
}

async function login(page, context, EMAIL, PASSWORD, COOKIE_PATH) {

  // 🔥 Step 1: check login WITHOUT throwing
  if (await isLoggedIn(page)) {
    console.log("✅ Already logged in (cookies)");
    return;
  }

  console.log("🔐 Logging in...");

  // 🔥 Step 2: Click login button. This will now throw an error if not found.
  await page.locator('#login_Layer').click();

  await page.waitForLoadState('domcontentloaded');
  await delay(3000, 5000);

  // 🔥 Step 3: wait for login form
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