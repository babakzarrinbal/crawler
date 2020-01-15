const {
  getPagesReg,
} = require("../../utils/regexcrawler");
let exp = {};
qltysort = ["hdcm", "dvdscr", "360p", "480p", "720p", "1080p", "unknown"];
exp.main = async function(
  urls = [
    "https://www.film2movie.li/page/1",
    "https://www.film2movie.li/page/2",
    "https://www.film2movie.li/page/3",
    "https://www.film2movie.li/page/4"
  ],
  regex={
    page : [
      /<section[^>]*class="main"[^>]*>.*?<\/section>/,
      /<a[^>]*class="more-link"[^>]*?>/g,
      /href="(.*?)"/
    ],
    data : {
      links: [/<a[^>]*>لینک مستقیم<\/a>/g, /href="(.*?)"/],
      imdb: /imdb\.com\/title\/(tt\d+)/
    },
    
  },
  getcurrentcallback
) {
  let links = await getPagesReg(urls, regex.page, 50);
  let pagelinks = links.reduce((cu, c) => [...cu, ...c.data], []);
  let videolinks = await getPagesReg(pagelinks, regex.data, 50);
  return exp.videolinkformatter(videolinks,getcurrentcallback);
};

exp.videolinkformatter = (videolinks,getcurrentcallback) =>
  videolinks.map(vl => {
    let imdbid = (vl.data.imdb[0] || "").toLowerCase();
    let current = getcurrentcallback ? getcurrentcallback(imdbid):null;
    let currentinks = current?[...current.links,...current.trailers]:[];
    if (!imdbid) return;
    let movie = {
      imdb: imdbid,
      url: vl.url
    };
    // create currect link format
    movie.links = current?current.links:[];
    movie.trailers = current?current.trailers:[];
    vl.data.links.forEach(link => {
      if (
        !["mkv", "mp4"].includes(
          link.slice(link.lastIndexOf(".") + 1).toLowerCase()
        )
      )
        return;
      if(currentinks.includes(link)) return;
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
        let season = (
          (filename.match(/\.s([0-9]{2})\./) || [])[1] || ""
        ).replace(/\./g, "");
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
    movie.trailers.sort((a, b) =>
      qltysort.indexOf(a.quality) > qltysort.indexOf(b.quality) ? 1 : -1
    );

    if ((movie.trailers[0] || {}).season)
      movie.trailers.sort((a, b) => (a.season > b.season ? 1 : -1));
    movie.links.sort((a, b) =>
      qltysort.indexOf(a.quality) > qltysort.indexOf(b.quality) ? 1 : -1
    );
    if ((movie.links[0] || {}).episode)
      movie.links.sort((a, b) =>
        a.season + "-" + a.episode > b.season + "-" + a.episode ? 1 : -1
      );
    return movie;
  }).filter(m=>m);

module.exports = exp;
