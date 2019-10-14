const puppeteer = require("puppeteer");
const fs = require("fs");
const f2m = require("./linkscrappers/film2movies");
global.delay = timout => {
  return new Promise(resolve => setTimeout(resolve, timout));
};
global.goto = (page, url, options = {}) => {
  return new Promise(async mresolve => {
    try {
      if (options.stop || options.stopcallback) {
        options.stop = options.stop || 3000;
        page.goto(url, options);
        if (options.stopcallback) {
          while (!(await page.evaluate(options.stopcallback))) {
            await delay(options.stop || 2000);
          }
        } else {
          await delay(options.stop || 2000);
        }
        await page.evaluate(() => {
          window.stop();
        });
        mresolve();
      } else {
        await page.goto(url, options);
      }
      mresolve();
    } catch (err) {
      console.log("babak------------------", err);
    }
  });
};

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  try {
    let f2mmovies = await f2m(browser, { pages: [1, 2] });
    console.log("finished");
    fs.writeFile(
      "./tests/imdbtest.json",
      JSON.stringify(f2mmovies, null, 2),
      () => {}
    );
  } catch (err) {
    console.log(err);
  }
})();
