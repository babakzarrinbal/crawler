const fetch = require('node-fetch');
const https = require('https'); //Add This
fetch("https://dl14.ftk.pw/user/shahab/film/Home.2015.720p.BluRay.x265.HEVC.SUBFA.Film2Movie_li.mkv", {
  method: 'HEAD',
  agent: new https.Agent({
    rejectUnauthorized: false,
  })}).then(r=>console.log((Number(r.headers.get('content-length'))/1048576)+" MB"));