const puppeteer = require("puppeteer");
const { exec } = require("child_process");
const fs = require("fs");
const f2m = require("./linkscrappers/film2movies");
const { getMoviesInfos } = require("./utils/open_imdb");
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
    let f2mmovies = await f2m(browser, { pages: "1-3" });
    let movies = await getMoviesInfos(f2mmovies);
    movies.forEach(m => {
      let curmov = fs.readFileSync(`./db/zmovies/videos/${m.imdb}.json`);
      if(curmov) {
        curmov = JSON.parse(curmov);
        if(!(m.Info||{}).Title) m.Info = curmov.Info || {};
      }
      fs.writeFile(
        `./db/zmovies/videos/${m.imdb}.json`,
        JSON.stringify(m),
        () => {}
      );
    });
  } catch (err) {
    console.log(err);
  }
  exec(
    'cd db && git add . && git commit -m "autocommit" && git push ',
    console.log
  );
})();
