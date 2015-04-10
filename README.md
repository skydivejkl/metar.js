[![Build Status](https://travis-ci.org/epeli/metar.js.png?branch=master)](https://travis-ci.org/epeli/metar.js)

# metar.js

[METAR](http://en.wikipedia.org/wiki/METAR) (Meteorological Aviation Report) parser for Javascript

Demo: <http://epeli.github.io/metar.js/>

## Install

node.js or browserify

    npm install metar

browser

```html
<script src="metar.js"></script>
```

## Example

Get reports from <http://weather.noaa.gov/pub/data/observations/metar/stations/>

```javascript
// only required in node or browserify otherwise it's a global.
var parseMETAR = require("metar");

console.log(parseMETAR("EFJY 171950Z AUTO 27006KT 220V310 9999 FEW012 SCT015 BKN060 13/12 Q1006"));
```

```json
{
    "station": "EFJY",
    "time": "2013-12-17T19:50:38.219Z",
    "auto": true,
    "wind": {
        "speed": 6,
        "gust": null,
        "direction": 270,
        "variation": {
            "min": 220,
            "max": 310
        },
        "unit": "KT"
    },
    "cavok": false,
    "visibility": 9999,
    "weather": null,
    "clouds": [
        {
            "abbreviation": "FEW",
            "meaning": "few",
            "altitude": 1200,
            "cumulonimbus": false
        },
        {
            "abbreviation": "SCT",
            "meaning": "scattered",
            "altitude": 1500,
            "cumulonimbus": false
        },
        {
            "abbreviation": "BKN",
            "meaning": "broken",
            "altitude": 6000,
            "cumulonimbus": false
        }
    ]
}
```

# Changelog

## 0.3.0

- Parse REUP [#16](https://github.com/skydivejkl/metar.js/pull/16)
- Added METAR|SPECI type parsing [#15](https://github.com/skydivejkl/metar.js/pull/15)
- Added RVR parser

## 0.2.0

  - Support negative dewpoint and air temp [#10](https://github.com/epeli/metar.js/pull/10)

