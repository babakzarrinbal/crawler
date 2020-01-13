const {
  getLinks,
  getPagesReg,
  getEachLinks
} = require("../utils/regexcrawler");
let exp = {};
qltysort = ["hdcm", "dvdscr", "360p", "480p", "720p", "1080p", "unknown"];
exp.main = async function(
  urls = [
    "https://www.film2movie.li/page/1",
    "https://www.film2movie.li/page/2",
    "https://www.film2movie.li/page/3",
    "https://www.film2movie.li/page/4"
  ],
  pageregex = [
    /<section[^>]*class="main"[^>]*>.*?<\/section>/,
    /<a[^>]*class="more-link"[^>]*?>/g,
    /href="(.*?)"/
  ],
  linkregex = [/<a[^>]*>لینک مستقیم<\/a>/g],
  imdbregex = /imdb\.com\/title\/(tt\d+)/
) {
  urls = Array.isArray(urls) ? urls : [urls];
  let links = await getPagesReg(urls, pageregex, 16);
  let pagelinks = links.reduce((cu, c) => [...cu, ...c.data], []);
  let videolinks = await getPagesReg(
    pagelinks,
    { links: linkregex, imdbid: imdbregex },
    16
  );
  return videolinks.map(vl => {
    let movie = {};
    movie.url = vl.url;
    let rawlinks = vl.data.links.map(l => l.match(/href="(.*?)"/)[1]);
    movie.imdb = (vl.data.imdbid[0] || "").toLowerCase();

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
      let l = { quality, link };
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
    return movie;
  });
};
// (async () => {
//   console.log(await exp.main(1));
// })();
module.exports = exp;
