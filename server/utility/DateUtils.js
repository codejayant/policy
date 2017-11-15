const _MS_PER_DAY = 1000 * 60 * 60 * 24;

// a : current date
// b : shipping date
function dateDiffInDays(a, b) {

    let utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    let utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc1 - utc2) / _MS_PER_DAY);
}

module.exports = {dateDiffInDays};