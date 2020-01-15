let exp = {};
const qltysort = ["hdcm", "dvdscr", "360p", "480p", "720p", "1080p", "unknown"];

// creates array from numbers specefied with dash and comma seperated
exp.ArrFromText = function(pages) {
  return [].concat(
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
};

//create array of numbers from min to max
exp.ArrOfNum = (min = 0, max = 10) =>
  Array.from({ length: max - min + 1 }, (_, i) => min + i);

//performs chains of regex on a string or array of strings and returns an array of results
exp.chainReg = function chainReg(text, regex) {
  if (!text || !text.length) return [];
  if (!Array.isArray(regex)) {
    if (typeof regex == "object" && !(regex instanceof RegExp)) {
      return Object.keys(regex).reduce(
        (result, rk) => ({
          ...result,
          [rk]: chainReg(text, regex[rk])
        }),
        {}
      );
    }
    regex = [regex];
  }
  if (!Array.isArray(text)) text = [text];
  return regex.reduce((result, r) => {
    if (!result.length) return [];
    return result.reduce((cu, re) => {
      let regresult = re.match(r);
      if (!regresult) return cu;
      return [
        ...cu,
        ...(regresult.index ? [regresult[1] || regresult[0]] : regresult)
      ];
    }, []);
  }, text);
};

exp.movieSorter = function(movie){
  movie.trailers.sort((a, b) =>
    qltysort.indexOf(a.quality) > qltysort.indexOf(b.quality) ? 1 : -1
  );

  if ((movie.trailers[0] || {}).season)
    movie.trailers.sort((a, b) => (a.season > b.season ? 1 : -1));

  movie.links.sort((a, b) =>
    qltysort.indexOf(a.quality) > qltysort.indexOf(b.quality) ? 1 : -1
  );
  if ((movie.links[0] || {}).episode)
    movie.links.sort((a, b) =>{
      return a.season + "-" + a.episode > b.season + "-" + b.episode ? 1 : -1}
    );
}
module.exports = exp;

//test