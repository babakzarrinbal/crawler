const puppeteer = require("puppeteer");

const delay = timout => new Promise(resolve => setTimeout(resolve, timout));
const goto = (page, url, options = {}) =>
  new Promise(async mresolve => {
    try {
      if (options.stop || options.stopcallback) {
        options.stop = options.stop || 5000;
        page.goto(url, options);
        if (options.stopcallback)
          while (!(await page.evaluate(options.stopcallback)))
            await delay(options.stop);
        else await delay(options.stop);
        await page.evaluate(() => {
          window.stop();
        });
        mresolve();
      } else await page.goto(url, options);
      mresolve();
    } catch (e) {
      console.log("pagegoto Error: ", e);
    }
  });
/**
 *
 *
 * @param {object} actions 
 * @param {object} Emmiter event emmiter to emit the events
 * @param {string|[string]} actions.url urls to crawl
 * @param {function} actions.script script to run on urls
 * @param {[*]} actions.scriptArgs arguments to pass to scripts
 * @param {string} actions.event event to dispath
 * @param {object} options 
 * @param {boolean} options.headless whether the browser is headless or not
 * @param {number} options.threads number of pages in the browser
 */
const initiate = async function(actions, Emitter,options = {}) {
  const browser = await puppeteer.launch({ headless: options.headless||false });
  let OpenPages = await browser.pages();
  for (let i = 0; i < (options.threads || 8) - OpenPages.length; i++)
    await browser.newPage();
  OpenPages = await browser.pages();
  if (!Array.isArray(actions)) actions = [actions];
  let resolver;
  let promise = new Promise(rs => (resolver = rs));
  tick({
    browser,
    pages: OpenPages,
    actions,
    Emitter,
    jobPromise: { promise, resolver }
  });
  return promise;
};

const tick = async function tick(inp) {
  if (!inp.browser) return;
  let freepage = inp.pages.find(p => !p.busy);
  if (!freepage) return;
  let action = inp.actions.find(a => !a.PStatus);
  if (!action) {
    if (!inp.actions.find(a => !["done", "error"].includes(a.PStatus))) {
      if (inp.browser) {
        await inp.browser.close();
        inp.browser = undefined;
      }
      inp.jobPromise.resolver();
      return;
    }
    return setTimeout(() => {
      tick(inp);
    }, 1000);
  }

  if (Array.isArray(action.url)) {
    inp.actions.push(
      ...action.url.map(url => ({
        url,
        script: action.script,
        event: action.event
      }))
    );
    action.PStatus = "done";
    return tick(inp);
  }
  action.PStatus = "processing";
  freepage.busy = true;
  for (
    i = 0;
    i < Math.min(inp.pages.filter(p => !p.busy).length, inp.actions.length);
    i++
  )
    tick(inp);
  try {
    await goto(freepage, action.url);
    if (typeof action.script == "string") {
      eval("action.script=" + action.script);
    }
    let result = await freepage.evaluate(
      action.script,
      ...(action.scriptArgs || [])
    );
    if (result.url && result.script) {
      if (Array.isArray(result.url)) {
        inp.actions.push(
          ...result.url.map(url => ({
            url,
            script: result.script,
            event: result.event
          }))
        );
      } else {
        inp.actions.push(result);
      }
    }
    freepage.busy = undefined;
    tick(inp);
    if (inp.Emitter && action.event) inp.Emitter.emit(action.event,result);
    action.PStatus = "done";
  } catch (e) {
    console.log("Error in crawling: ", e);
    freepage.busy = undefined;
    action.PStatus = "error";
    tick(inp);
  }
};

module.exports = initiate;
// //test
// initiate({
//   url: "https://www.film2movie.li/page/1",
//   script: function() {
//     try {
//       let url = Array.from(document.querySelectorAll(".more-link")).map(
//         a => a.href
//       );
//       return {
//         url,
//         script: function() {
//           let imdb;
//           let links = Array.from(document.querySelectorAll("a")).reduce(
//             (result, a) => {
//               if (a.href.includes("imdb.com/title/"))
//                 imdb = a.href.match(/\/tt([0-9]*?)\//)[1];
//               if (a.innerHTML == "لینک مستقیم") result.push(a.href);
//               return result;
//             },
//             []
//           );
//           return {
//             url: window.location.href,
//             imdb,
//             links
//           };
//         }.toString(),
//         callback: ((...args) => console.log(...args)).toString()
//       };
//     } catch (e) {
//       console.log(e);
//       return e;
//     }
//   }
// });
