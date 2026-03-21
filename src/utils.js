const fs = require('fs');

const delay = (min = 2000, max = 5000) =>
  new Promise(res => setTimeout(res, Math.random() * (max - min) + min));

async function retry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await delay();
    }
  }
}

function loadCookies(context, path) {
  if (fs.existsSync(path)) {
    const cookies = JSON.parse(fs.readFileSync(path));
    return context.addCookies(cookies);
  }
}

function saveCookies(context, path) {
  return context.cookies().then(cookies =>
    fs.writeFileSync(path, JSON.stringify(cookies, null, 2))
  );
}

module.exports = { delay, retry, loadCookies, saveCookies };