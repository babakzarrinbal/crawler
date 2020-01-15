// require("promise.prototype.finally").shim();
// const fs = require('fs')
const async = require("async");
var getMInfo = id =>
  new Promise((resovle, reject) => {
    const http = require("http");
    http
      .get(`http://www.omdbapi.com/?i=${id}&apikey=21a6c919`, resp => {
        let data = "";
        let result;
        resp.on("data", chunk => (data += chunk));
        resp.on("end", () => {
          try {
            result = JSON.parse(data);
          } catch (e) {
            result = data;
          }
          resovle(result);
        });
      })
      .on("error", reject);
  });
let q;

var GetInfos = async (movies, cb, threads = 16) => {
  if (!q) {
    q = async.queue(
      (movie, callback) => getMInfo(movie.imdb).then(callback),
      threads
    );
  }
  if (!Array.isArray(movies)) movies = [movies];
  movies.forEach(m =>
    q.push(m, result => {
      m.Info = result;
      cb(m);
    })
  );
};
var getMoviesInfos = async function(movies) {
  return Promise.all(
    movies.map(
      v =>
        new Promise(async resolve => {
          let Info;
          try {
            Info = await getMInfo(v.imdb);
          } catch (e) {
            Info = {};
          }
          return resolve({ ...v, Info: Info.Title ? Info : {} });
        })
    )
  );
};

module.exports = {
  getMInfo,
  getMoviesInfos,
  GetInfos
};
// testing
// let movies = require('../tests/imdbtest.json');

// let init = async () => {

//   let finalmovies = await Promise.all(movies.map(v=>new Promise(async resolve=>{
//     let Info;
//     try{
//       Info = await getMInfo(v.imdb)
//     }catch(e){
//       Info={}
//     }
//     return resolve({...v,Info});
//   })));

//   fs.writeFile(
//     "./tests/imdbtest2.json",
//     JSON.stringify(finalmovies, null, 2),
//     () => {}
//   );

// }

// init();
