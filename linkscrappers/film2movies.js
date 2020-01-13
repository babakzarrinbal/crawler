const host = "https://www.film2movie.li";
qltysort = ["hdcm", "dvdscr", "360p", "480p", "720p", "1080p", "unknown"];
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
  logging = options.logging == undefined ? defaults.logging : options.logging;
  pages = options.pages || defaults.pages;
  pages = [].concat(
    ...pages
      .toString()
      .split(",")
      .map(p => {
        if (!p.includes("-")) return Number(p);
        let r = p.split("-").map(p => Number(p));
        let min = Math.min(r[0], r[1]);
        let max = Math.max(r[0], r[1]);
        return Array.from({ length: max - min + 1 }, (_, i) => min + i);
      })
  );
  queue = options.queue || defaults.queue;
  browser = brw;
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
      // await Promise.all(dpages.map(dp => dp.page.close()));
      resolve(movies);
    };
  });
};

var getpagelinks = async function(pages) {
  let page = await browser.newPage();
  return new Promise(async resolve => {
    let pushedlinks = [];
    for (let i of pages) {
      await goto(page, host + "/page/" + i, { stop: 5000 });
      pagelinks = await page.$$eval(".main>.box>.content>a", el =>
        el.map(e => e.href)
      );
      logging && console.log(`page ${i} pagelinks extracted!`);
      pagelinks.forEach(link => {
        if (pushedlinks.includes(link)) return;
        pushedlinks.push(link);
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

  atags =  await page.$$eval("a", el => {
    return el.map(e => ({ href: e.href, text: e.innerText }));
  });
  try {
    let imdbid = (
      atags.find(a => a.href.includes("imdb.com")) || { href: "" }
    ).href.toLowerCase();
    movie.imdb = imdbid;
    if (movies.find(m => m.imdb == imdbid)) return resolver();
    let rawlinks = atags
      .filter(
        a =>
          a.text == "لینک مستقیم" &&
          !a.href.includes(host) &&
          ["mp4", "mkv"].includes(a.href.slice(-3).toLowerCase())
      )
      .map(a => a.href);

    // create currect link format
    movie.links = [];
    movie.trailers = [];
    rawlinks.forEach(link => {
      let filename = link.slice(link.lastIndexOf("/") + 1).toLowerCase();
      let quality = (
        (filename.match(
          /\.h\.d\.cm\.|\.d\.vd\.scr\.|\.360p\.|\.480p\.|\.720p\.|\.1080p\./
        ) || [])[0] || "unknown"
      ).replace(/\./g, "");
      let trailer = ((filename.match(/\.trailer\./) || [])[0] || "").replace(
        /\./g,
        ""
      );
      let l = { quality, link, type: "link" };
      if (trailer) {
        l.type = "trailer";
        let season = (
          (filename.match(/\.s([0-9]{2})\./) || [])[1] || ""
        ).replace(/\./g, "");
        if (season) l.season = Number(season);
        movie.trailers.push(l);
        movie.trailers.sort((a, b) =>
          qltysort.indexOf(a.quality) > qltysort.indexOf(b.quality) ? 1 : -1
        );
        if (season)
          movie.trailers.sort((a, b) => (a.season > b.season ? 1 : -1));
        return;
      }
      let sesonepisode = filename.match(/\.s([0-9]{2})e([0-9]{2})\./);
      // console.log(sesonepisode)
      if (sesonepisode && sesonepisode.length) {
        l.season = Number(sesonepisode[1]);
        l.episode = Number(sesonepisode[2]);
      }
      movie.links.push(l);
      movie.links.sort((a, b) =>
        qltysort.indexOf(a.quality) > qltysort.indexOf(b.quality) ? 1 : -1
      );
      if (sesonepisode) {
        movie.links.sort((a, b) => (a.episode > b.episode ? 1 : -1));
        movie.links.sort((a, b) => (a.season > b.season ? 1 : -1));
      }

      return;
    });
    imdbarr = movie.imdb.split("/");
    movie.imdb = imdbarr[imdbarr.indexOf("title") + 1];
    logging && console.log(`${movie.imdb} links extracted!`);
  } catch (err) {
    console.log('get movielink Error: ',err);
  }

  pageobj.free = true;
  movie.updatedAt = new Date();
  if (movie.imdb) movies.push(movie);
  resolver();
};

module.exports = main;
