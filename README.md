# metar.js

[METAR](http://en.wikipedia.org/wiki/METAR) (Meteorological Aviation Report) parser for Javascript

Demo: <http://epeli.github.io/metar.js/>

## Install

node.js

    npm install metar

browser

```html
<script src="metar.js"></script>
```

## Example

Get reports from <http://weather.noaa.gov/pub/data/observations/metar/stations/>

```javascript
var parseMETAR = require("metar");

console.log(parseMETAR("EFJY 172120Z AUTO 30004KT 260V330 CAVOK 11/10 Q1008"));
```

