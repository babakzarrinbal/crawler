const fs = require("fs");
const path = require("path");
const { GetInfos } = require("../utils/open_imdb");
let noinfomovies = [];
fs.readdirSync(path.resolve("./db/zmovies/videos")).forEach(
  async (file, index) => {
    let filepath = path.resolve("./db/zmovies/videos", file);
    let curmov;
    try {
      curmov = require(filepath);
    } catch (e) {
      fs.unlinkSync(filepath);
    }
    if ((curmov.Info || {}).Title) return;
    noinfomovies.push(curmov);
  }
);
console.log(noinfomovies.length)
GetInfos(noinfomovies.splice(0,128)).then(ms => {

  ms.forEach(m=>{
    let filepath = path.resolve("./db/zmovies/videos", m.imdb+".json");
    console.log((m.Info||{}).Title,filepath)
    fs.writeFileSync(filepath, JSON.stringify(m));

  })
});
