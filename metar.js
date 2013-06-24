(function() {
// http://www.met.tamu.edu/class/metar/metar-pg10-sky.html
// https://ww8.fltplan.com/AreaForecast/abbreviations.htm
// http://en.wikipedia.org/wiki/METAR
// http://www.unc.edu/~haines/metar.html

var CLOUDS = {
    NCD: "no clouds",
    SKC: "sky clear",
    CLR: "no clouds under 12,000 ft",
    NSC: "no significant",
    FEW: "few",
    SCT: "scattered",
    BKN: "broken",
    OVC: "overcast",
    VV: "vertical visibility"
};


var WEATHER = {
    // Intensity
    "-": "light intensity",
    "+": "heavy intensity",
    VC: "in the vicinity",

    // Descriptor
    MI: "shallow",
    PR: "partial",
    BC: "patches",
    DR: "low drifting",
    BL: "blowing",
    SH: "showers",
    TS: "thunderstorm",
    FZ: "freezing",

    // Precipitation
    RA: "rain",
    DZ: "drizzle",
    SN: "snow",
    SG: "snow grains",
    IC: "ice crystals",
    PL: "ice pellets",
    GR: "hail",
    GS: "small hail",
    UP: "unknown precipitation",

    // Obscuration
    FG: "fog",
    VA: "volcanic ash",
    BR: "mist",
    HZ: "haze",
    DU: "widespread dust",
    FU: "smoke",
    SA: "sand",
    PY: "spray",

    // Other
    SQ: "squall",
    PO: "dust or sand whirls",
    DS: "duststorm",
    SS: "sandstorm",
    FC: "funnel cloud"
};

function parseAbbreviation(s, map) {
    var abbreviation, meaning, length = 3;
    if (!s) return;
    while (length && !meaning) {
        abbreviation = s.slice(0, length);
        meaning = map[abbreviation];
        length--;
    }
    if (meaning) {
        return {
            abbreviation: abbreviation,
            meaning: meaning
        };
    }
}

function asInt(s) {
    return parseInt(s, 10);
}



function METAR(metarString) {
    this.fields = metarString.split(" ").map(function(f) {
        return f.trim();
    }).filter(function(f) {
        return !!f;
    });
    this.i = -1;
    this.current = null;
    this.result = {};
}

METAR.prototype.next = function() {
    this.i++;
    return this.current = this.fields[this.i];
};

METAR.prototype.peek = function() {
    return this.fields[this.i+1];
};

METAR.prototype.parseStation = function() {
    this.next();
    this.result.station = this.current;
};

METAR.prototype.parseDate = function() {
    this.next();
    var d = new Date();
    d.setUTCDate(asInt(this.current.slice(0,2)));
    d.setUTCHours(asInt(this.current.slice(2,4)));
    d.setUTCMinutes(asInt(this.current.slice(4,6)));
    this.result.time = d;
};

METAR.prototype.parseAuto = function() {
    this.result.auto = this.peek() === "AUTO";
    if (this.result.auto) this.next();
};

var variableWind = /^([0-9]{3})V([0-9]{3})$/;
METAR.prototype.parseWind = function() {
    this.next();
    this.result.wind = {
        speed: null,
        gust: null,
        direction: null,
        variation: null
    };

    var direction = this.current.slice(0,3);
    if (direction === "VRB") {
        this.result.wind.direction = "VRB";
        this.result.wind.variation = true;
    }
    else {
        this.result.wind.direction = asInt(direction);
    }

    var gust = this.current.slice(5,8);
    if (gust[0] === "G") {
        this.result.wind.gust = asInt(gust.slice(1));
    }

    this.result.wind.speed = asInt(this.current.slice(3,5));

    var unitMatch;
    if (unitMatch = this.current.match(/KT|MPS|KPH$/)) {
        this.result.wind.unit = unitMatch[0];
    }
    else {
        throw new Error("Bad wind unit: " + this.current);
    }

    var varMatch;
    if (varMatch = this.peek().match(variableWind)) {
        this.next();
        this.result.wind.variation = {
            min: asInt(varMatch[1]),
            max: asInt(varMatch[2])
        };
    }
};


METAR.prototype.parseCavok = function() {
    this.result.cavok = this.peek() === "CAVOK";
    if (this.result.cavok) this.next();
};

METAR.prototype.parseVisibility = function() {
    this.result.visibility = null;
    if (this.result.cavok) return;
    this.next();
    if (this.current === "////") return;
    this.result.visibility = asInt(this.current.slice(0,4));
    // TODO: Direction too. I've not seen it in finnish METARs...
};

METAR.prototype.parseRunwayVisibility = function() {
    if (this.result.cavok) return;
    if (this.peek().match(/^R[0-9]+/)) {
        this.next();
        // TODO: Parse it. I've not seen it in finnish METARs...
    }
};



function parseWeatherAbbrv(s, res) {
    var weather = parseAbbreviation(s, WEATHER);
    if (weather) {
        res = res || [];
        res.push(weather);
        return parseWeatherAbbrv(s.slice(weather.abbreviation.length), res);
    }
    return res;
}

METAR.prototype.parseWeather = function() {
    this.result.weather = null;
    if (this.result.cavok) return;
    var weather = parseWeatherAbbrv(this.peek());
    if (!weather) return;

    this.result.weather = weather;
    this.next();
};


METAR.prototype.parseClouds = function() {
    if (!this.result.clouds) this.result.clouds = null;
    if (this.result.cavok) return;
    var cloud = parseAbbreviation(this.peek(), CLOUDS);
    if (!cloud) return;

    this.next();

    cloud.altitude = asInt(this.current.slice(cloud.abbreviation.length))*100 || null;
    cloud.cumulonimbus = /CB$/.test(this.current);

    this.result.clouds = (this.result.clouds || []);
    this.result.clouds.push(cloud);

    this.parseClouds();
};

METAR.prototype.parse = function() {
    this.parseStation();
    this.parseDate();
    this.parseAuto();
    this.parseWind();
    this.parseCavok();
    this.parseVisibility();
    this.parseWeather();
    this.parseClouds();
};



function parseMETAR(metarString) {
    var m = new METAR(metarString);
    m.parse();
    return m.result;
}

if (typeof module !== "undefined") {
    module.exports = parseMETAR;
}
else if (typeof window !== "undefined") {
    window.parseMETAR = parseMETAR;
}

}());
