const fetch = require("node-fetch");
const async = require("async");
const helper = require("./helpers");
let exp = {};
exp.getLink = async function(url) {
  let pagetext;
  try {
    pagetext = await fetch(url).then(r => r.text());
  } catch (e) {
    pagetext = "";
  }
  return pagetext
    .match(/<a .*?\/a>/g)
    .map(a => ({ href: (a.match(/href="(.*?)"/) || [])[1], a }));
};

exp.getPageReg = (url, regex = /<a .*?\/a>/g) =>
  fetch(url)
    .then(r => r.text())
    .then(t => helper.chainReg(t, regex))
    .catch(e => []);

exp.getPagesReg = (urls, regex = /<a .*?\/a>/g, threads = 16) =>
  new Promise(resolve => {
    let flinks = [];
    let q = async.queue(
      async (url, callback) =>
        exp.getPageReg(url, regex).then(data => {
          flinks.push({ data, url });
          callback(flinks);
        }),
      threads
    );
    q.drain = l => {
      resolve(flinks);
    };
    urls.forEach(url => q.push(url));
  });

exp.getLinks = (urls = [], threads = 8) =>
  new Promise(resolve => {
    let links = [];
    let q = async.queue(
      async (url, callback) =>
        exp.getLink(url).then(link => {
          link.forEach(l => links.push(l));
          callback(links);
        }),
      threads
    );
    q.drain = l => {
      resolve(links);
    };
    urls.forEach(url => q.push(url));
  });

exp.getEachLinks = (urls = [], threads = 8) =>
  new Promise(resolve => {
    let flinks = [];
    let q = async.queue(
      async (url, callback) =>
        exp.getLink(url).then(links => {
          flinks.push({ url, links });
          callback(flinks);
        }),
      threads
    );
    q.drain = l => {
      resolve(flinks);
    };
    urls.forEach(url => q.push(url));
  });

module.exports = exp;

// //tests
// (async () => {
//   let links;
//   try {
//     let max = 10 ,min= 1;
//     let getlinks = Array.from({ length: max - min + 1 }, (_, i) => min + i).map(i=>"https://www.film2movie.li/page/"+i)
//     links = await exp.getLinks(getlinks);
//   } catch (e) {
//     console.log(e);
//   }
//   console.log(
//     links
//       .filter(
//         (l, i, a) =>
//           (l.url || "").match(/film2movie\.li\/[0-9]*?\//) &&
//           a.findIndex(v => v.url == l.url) == i
//       )
//       .map(l => l.url).length
//   );
// })();
