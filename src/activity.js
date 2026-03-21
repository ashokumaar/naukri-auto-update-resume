const { delay } = require('./utils');

async function simulateActivity(page) {
  console.log("📈 Simulating activity...");

  await page.goto('https://www.naukri.com/mnjuser/profile');
  await delay();

  await page.mouse.move(100, 200);
  await delay();

  await page.goto('https://www.naukri.com/jobs-in-india');
  await delay();
}

module.exports = simulateActivity;