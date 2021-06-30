# YouTube Trending Videos Scraper NodeJS Documentation
This NodeJS library can scrape all available trending pages of YouTube without any API usage. It is developed for and tailored towards easy usage in the [FreeTube](https://github.com/FreeTubeApp/FreeTube-Vue) rewrite but can be used with any other project as well.

Therefore, this library does not require any API keys, with the attached maximum quotas, but instead might take longer to receive the required data.

The library works as long as YouTube keeps its web page layout the same. Therefore, there is **no guarantee** that this library will work at all times.
If this library should not work at some point, please create an issue and let me know so that I can take a look into it. Pull requests are also welcomed in this case.

## Installation
`npm install yt-trending-scraper`

## Usage
`const ytrend = require("yt-trending-scraper")`

## API
**scrape_trending_page(_parameters_)**
Returns a list of objects containing all the information of the trending videos.

The parameters object can contain the following options:

``` 
 geoLocation:           String,
 parseCreatorOnRise:    Boolean,
 page:                  String,
 language:              String
```


__geoLocation__ is an optional parameter to change the country (e.g. JP for Japan) of the trending page. The alpha2 code of the country must be used


__parseCreatorOnRise__ is an optional parameter which allows the parser to process any horizontal video list, which usually is a creator on the rise. But this is not always available, so the scraper will process as usual even when the parameter is set to true. Defaults to **false**


__page__ is an optional parameter which allows to choose one of the 4 trending pages below.

- `default`
- `music`
- `gaming`
- `movies`

__language__ is an optional parameter to change the language (e.g. ja for Japanese) of the trending page. The ISO 639-1 code of the language should be used (although, YouTube also supports some regional dialects like en-US & fr-CA)
### Example usage

```javascript
const parameters = {
    geoLocation: 'JP',
    parseCreatorOnRise: false,
    page: 'music',
    language: 'ja'
}

ytrend.scrape_trending_page(parameters).then((data) =>{
    console.log(data);
}).catch((error)=>{
    console.log(error);
});

// The data is a list of objects containing the following attributes:
{
    videoId:            String,
    title:              String,
    type:               "video",
    author:             String,
    authorId:           String,
    authorUrl:          String,
    videoThumbnails:    Array[Objects],
    description:        String,
    viewCount:          Number,
    published:          Number as timestamp,
    publishedText:      String,
    lengthSeconds:      Number,
    timeText:           String,
    liveNow:            false,
    paid:               false,
    premium:            false,
    isUpcoming:         false,
    isCreatorOnRise:    Boolean, // indicates whether the video is part of a creator on the rise
    isVerified:         Boolean,
    isVerifiedArtist:   Boolean
}

// The thumbnail objects:
{
    quality:    "String",
    url:        "String",
    width:      Number,
    height:     Number
}
```
## Credits
Thanks to PrestoN for the basic instructions and underlying request code and thanks to ~cadence for the HTML extractor RegEx. 
