//module.exports = require("./src/Youtube-Scraper")
let a = require("./src/Youtube-Scraper")
async function b() {
    let data = await a.scrape_trending_page()

}

b()
