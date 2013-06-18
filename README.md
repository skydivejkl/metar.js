# metar.js

[METAR](http://en.wikipedia.org/wiki/METAR) (Meteorological Aviation Report) parser


## Install

    npm install metar

## Example

Get reports from <http://weather.noaa.gov/pub/data/observations/metar/stations/>

```javascript
var parseMETAR = require("metar");

console.log(parseMETAR("EFJY 172120Z AUTO 30004KT 260V330 CAVOK 11/10 Q1008"));
```

