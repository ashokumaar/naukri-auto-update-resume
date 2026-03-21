const { delay } = require('./utils');

async function goToProfile(page) {
  for (let i = 0; i < 3; i++) {
    await page.goto('https://www.naukri.com/mnjuser/profile', {
      waitUntil: 'domcontentloaded'
    });

    await delay(2000, 4000);

    if (page.url().includes('profile')) {
      console.log("✅ Profile page loaded");
      return;
    }

    console.log("🔁 Retrying profile navigation...");
  }

  throw new Error("❌ Failed to reach profile page");
}

module.exports = { goToProfile };