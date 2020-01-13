const puppeteer = require("puppeteer");
const { exec } = require("child_process");
const fs = require("fs");
const f2m = require("./linkscrappers/film2movies");
const f2mrg = require("./linkscrappers/film2movie.regex").main;
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
  try {
      let url = "https://www.film2movie.li/";
      let sublinkregex = /film2movie\.li\/d+?\//
      console.time('pages: '+url);
      let movies = await f2mrg(url);
      // let movies = await getMoviesInfos(f2mmovies);
      // console.log(movies);
      movies.forEach(m => {
        try {

          let curmov = require(`./db/zmovies/videos/${m.imdb}.json`);
          if (curmov) {
            curmov = JSON.parse(curmov);
            if (!(m.Info || {}).Title) m.Info = curmov.Info || {};
          }
        } catch (e) {}
          fs.writeFile(
          // `./db/zmovies/videos/${m.imdb}.json`,
          `./tests/${m.imdb}.json`,
          JSON.stringify(m),
          () => {}
        );
      });
      console.timeEnd('pages: '+url);
    
  } catch (err) {
    console.log('main error',err);
  }
  // exec(
  //   'cd db && git add . && git commit -m "autocommit" && git push ',
  //   console.log
  // );
})();
// (async () => {
//   const browser = await puppeteer.launch({ headless: false });
//   try {
//     for (let i = 619; i > 0; i--) {
//       let pages = i + "-";
//       i = i <= 200 ? (i = 1) : i - 200;
//       pages += i;
//       console.log('started: ',pages)
//       let f2mmovies = await f2m(browser, { pages ,logging:false});
//       let movies = await getMoviesInfos(f2mmovies);
//       movies.forEach(m => {
//         try {
//           let curmov = require(`./db/zmovies/videos/${m.imdb}.json`);
//           if (curmov) {
//             curmov = JSON.parse(curmov);
//             if (!(m.Info || {}).Title) m.Info = curmov.Info || {};
//           }
//         } catch (e) {}
//           fs.writeFile(
//           `./db/zmovies/videos/${m.imdb}.json`,
//           JSON.stringify(m),
//           () => {}
//         );
//       });
//       console.log('finished: ',pages);
//     }
//     browser.close();
//   } catch (err) {
//     console.log('main error',err);
//   }
//   exec(
//     'cd db && git add . && git commit -m "autocommit" && git push ',
//     console.log
//   );
// })();
