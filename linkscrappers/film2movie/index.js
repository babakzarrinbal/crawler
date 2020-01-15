const crawler = require("../../utils/browsercrawler");
const helper = require("../../utils/helpers");
const events = require('events');

/**
 * @param {string} pageRange comma/dash seperated for page numbers
 * @param {function} callback callback function for each movie
 * @param {object} options
 * @param {number} options.threads number of browser page
 * @param {string} options.url current url of film2movie site
 * @param {string} options.headless hiding of browser
 */
module.exports =  async function(pageRange = "1-5",callback, options = {}) {
  let url = options.url || "https://www.film2movie.li/page/";
  let pages = helper.ArrFromText(pageRange);
  let threads = options.threads || Math.min(pages.length * 8, 16);
  let Emitter = new events.EventEmitter();
  Emitter.on('f2mvideo',(video)=>callback? callback(videolinkformatter(video)):console.log(video));
  return crawler(
    {
      url: pages.map(p => url + p),
      script: function() {
        try {
          let url = Array.from(document.querySelectorAll(".more-link")).map(
            a => a.href
          );
          return {
            url,
            script: function() {
              let imdb;
              let links = Array.from(document.querySelectorAll("a")).reduce(
                (result, a) => {
                  if (a.href.includes("imdb.com/title/"))
                    imdb = (
                      (a.href.match(/\/(tt[0-9]*?)\//) || [])[1] || ""
                    ).toLowerCase();
                  if (
                    ["mkv", "mp4", "avi","3gp"].includes(
                      a.href.slice(a.href.lastIndexOf(".") + 1).toLowerCase()
                    )
                  )
                    result.push(a.href);
                  return result;
                },
                []
              );
              return {
                url: window.location.href,
                imdb,
                links
              };
            }.toString(),
            event:'f2mvideo'
          };
        } catch (e) {
          console.log(e);
          return e;
        }
      }
    },
    Emitter,
    { threads ,headless:options.headless}
  );
};

const videolinkformatter = vl => {
  if (!vl.imdb) return null;
  let movie = {
    imdb: vl.imdb,
    url: vl.url
  };
  // create currect link format
  movie.links = [];
  movie.trailers = [];
  vl.links.forEach(link => {
    if (
      !["mkv", "mp4","3gp","avi"].includes(
        link.slice(link.lastIndexOf(".") + 1).toLowerCase()
      )
    )
      return;
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
    let l = { quality, link };
    if (trailer) {
      let season = ((filename.match(/\.s([0-9]{2})\./) || [])[1] || "").replace(
        /\./g,
        ""
      );
      if (season) l.season = Number(season);
      movie.trailers.push(l);
      return;
    }
    let sesonepisode = filename.match(/\.s([0-9]{2})e([0-9]{2})\./);
    if (sesonepisode && sesonepisode.length) {
      l.season = Number(sesonepisode[1]);
      l.episode = Number(sesonepisode[2]);
    }
    movie.links.push(l);
    return;
  });
  return movie;
};
