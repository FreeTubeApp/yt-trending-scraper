const fs = require("fs")
const requester = require("./TrendingRequester")
const cheerio = require('cheerio');


class YoutubeScraper {
    static scrape_trending_page() {
        requester.requestTrendingPage()
            .then((data) => this.data_receive_ok(data))
            .catch((error) => this.data_receive_failed(error))
    }

    static data_receive_ok(request_data){
        console.log(">Success requesting trending page");
        this.parse_html(request_data.data);
    }

    static data_receive_failed(error){
        console.log("ERROR", error);
    }

    static parse_html(html_data){
        /*fs.writeFile("./Received_data.html", html_data, (err) =>{
            if(err){
                throw err;
            }
            console.log("Wrote Data Successfully")

        });*/
        let html_parsed = cheerio.load(html_data)
        let extracted_script_tag = html_parsed('script').get()[26].children[0].data

        // debugging purposes
        fs.writeFile("./test.json", extracted_script_tag, (err) =>{
            if(err){
                throw err;
            }
            console.log("Wrote Data Successfully")

        });
        //TODO remove the first part of string up to the first curly open bracket and remove the last parts of the string after the closing curly bracket

        //console.log($)
    }
}
module.exports = YoutubeScraper
