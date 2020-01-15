const f2m = require("./linkscrappers/film2movie");
const { GetInfos } = require("./utils/open_imdb");
const { movieSorter } = require("./utils/helpers");
const fs = require("fs");

(async function() {
  let callback = async function(m) {
    // m = await new Promise(resolve => GetInfos(m, resolve));
    // if(!m.Info.Title) console.log(m.imdb,"> no Info")
    try {
      let curmov = require(`./db/zmovies/videos/${m.imdb}.json`);
      if (curmov && !(m.Info || {}).Title) m.Info = curmov.Info || {};
      // for (li of ["links", "trailers"]) {
      //   curmov[li].forEach(l => {
      //     if (m[li].find(ls => ls.link == l.link)) return;
      //     m[li].push(l);
      //   });
      // }
      m.url = Array.from(
        new Set([
          m.url,
          ...(Array.isArray(curmov.url) ? curmov.url : [curmov.url])
        ])
      );
    } catch (e) {}
    movieSorter(m);
    fs.writeFile(
      `./db/zmovies/videos/${m.imdb}.json`,
      // `./tests/${m.imdb}.json`,
      JSON.stringify(m),
      () => {
        console.log(m.imdb, " updated");
      }
    );
  };

  f2m("1-10", callback,{headless:true});
})();

// const puppeteer = require("puppeteer");
// const { exec } = require("child_process");
// const path = require('path');
// const fs = require("fs");
// const f2m = require("./linkscrappers/film2movies");
// const f2mrg = require("./linkscrappers/film2movie.regex").main;
// const helper = require("./utils/helpers");
//regex crawler
// (async () => {
// try {
//   let url = "https://www.film2movie.li/page/";
//   let step = 6
//   for (let i = 1; i < 11; i++) {
//     console.log(`pages: ${i}-${i+step-1}`);
//     let movies = await f2mrg(helper.ArrOfNum(i, i+step-1).map(l => url + l),undefined,getcurfile);
//     i +=(step-1);
//     movies.forEach(m => {
//       console.log(m.imdb,m.links.length,m.trailers.length)
//       try {
//         let curmov = require(`./db/zmovies/videos/${m.imdb}.json`);
//         if (curmov && !(m.Info || {}).Title) m.Info = curmov.Info || {};
//       } catch (e) {}
//       if(!m.links.length && !m.trailers.length) return;

//       fs.writeFile(
//         `./db/zmovies/videos/${m.imdb}.json`,
//         // `./tests/${m.imdb}.json`,
//         JSON.stringify(m),
//         () => {}
//       );
//     });
//   }
// } catch (err) {
//   console.log("main error", err);
// }

// exec(
//   'cd db && git add . && git commit -m "autocommit" && git push ',
//   console.log
// );
// })();

//old crawler
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
