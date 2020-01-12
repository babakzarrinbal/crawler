let pages = require("../tests/imdbtest.json");
const fs = require('fs')
for (p of pages) {
  p.links = p.rawlinks.map(link => {
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
      let season = ((filename.match(/\.s([0-9]{2})\./) || [])[1] || "").replace(
        /\./g,
        ""
      );
      if (season) l.season = Number(season);
    }
    let sesonepisode = filename.match(/\.s([0-9]{2})e([0-9]{2})\./);
    // console.log(sesonepisode)
    if (sesonepisode && sesonepisode.length) {
      l.season = Number(sesonepisode[1]);
      l.episode = Number(sesonepisode[2]);
    }
    return l;
  });
  delete p.rawlinks;
  
}
fs.writeFile(
  "../tests/imdbtest3.json",
  JSON.stringify(pages, null, 2),
  () => {}
);
