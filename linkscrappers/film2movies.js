const host = "https://www.film2movie.li";
const defaults = {
  pages: 1,
  queue: 8,
  logging: true
};

var async = require("async");
var linkpage = [],
  movies = [],
  detailqueue,
  dpages = [],
  logging,
  browser;

/**
 *
 * @param {*} browser puppeteer browser object
 * @param {object} options
 * @param {number|number[]} options.pages page number to scrap or start to end array
 * @param {number} options.queue count of parallel pages
 * @param {boolean} options.logging enables console.log
 */
var main = function(brw, options = {}) {
  logging = options.logging || defaults.logging;
  pages = options.pages || defaults.pages;
  queue = options.queue || defaults.queue;
  options;
  browser = brw;
  if (!Array.isArray(pages)) pages = [pages];
  return new Promise(async resolve => {
    detailqueue = async.queue(getmovielinks, queue);
    while (dpages.length < queue) {
      let dp = {
        id: dpages.length + 1,
        page: null,
        free: true
      };
      dpages.push(dp);
      dp.page = await browser.newPage();
    }

    await getpagelinks(pages);
    detailqueue.drain = async () => {
      await Promise.all(dpages.map(dp => dp.page.close()));
      resolve(movies);
    };
  });
};

var getpagelinks = async function(pages) {
  let page = await browser.newPage();
  return new Promise(async resolve => {
    let spage = pages[0] || 1;
    let fpage = pages[1] || pages[0] || 1;
    for (let i = spage; i <= fpage; i++) {
      await goto(page, host + "/page/" + i, { stop: 5000 });
      pagelinks = await page.$$eval(".main>.box>.content>a", el =>
        el.map(e => e.href)
      );
      logging && console.log(`page ${i} pagelinks extracted!`);
      pagelinks.map(async link => {
        detailqueue.push(link);
      });
      linkpage = [...linkpage, ...pagelinks];
    }
    resolve();
  });
};

var getmovielinks = async function(link, resolver = () => {}) {
  let pageobj = dpages.find(dp => dp.free);
  while (!pageobj) {
    await delay(2000);
    return detailqueue.push(link, resolver);
  }

  let page = pageobj.page;
  let movie = {};
  pageobj.free = false;
  await goto(page, link, { stop: 7000 });

  atags = movie.links = await page.$$eval("a", el => {
    return el.map(e => ({ href: e.href, text: e.innerText }));
  });
  try {
    movie.links = atags
      .filter(
        a =>
          a.text == "لینک مستقیم" &&
          !a.href.includes(host) &&
          ["mp4", "mkv"].includes(a.href.slice(-3).toLowerCase())
      )
      .map(a => a.href);
    movie.imdb = (
      atags.find(a => a.href.includes("imdb.com")) || { href: "" }
    ).href.toLowerCase();
    imdbarr = movie.imdb.split("/");
    movie.imdb = imdbarr[imdbarr.indexOf("title") + 1];
    logging && console.log(`${movie.imdb} links extracted!`);
  } catch (err) {
    console.log(err);
  }
  pageobj.free = true;
  if (movie.imdb) movies.push(movie);
  resolver();
};

module.exports = main;
