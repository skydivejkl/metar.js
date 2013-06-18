
// http://www.met.tamu.edu/class/metar/metar-pg10-sky.html
// http://en.wikipedia.org/wiki/METAR

var CLOUDS = {
    NCD: "No clouds",
    SKC: "Sky clear",
    CLR: "No clouds under 12,000 ft",
    NSC: "No significant",
    FEW: "Few",
    SCT: "Scattered",
    BKN: "Broken",
    OVC: "Overcast",
    VV: "Vertical visibility"
};


var weather = {
    specifier: ["-", "+", "VC", "RE"],
    nature: ["MI", "BC", "PR", "DR", "BL", "SH", "FZ"],
    rain: ["DZ", "RA", "SN", "SG", "IC", "PL", "GR", "GS", "UP"],
    visibility: ["BR", "FG", "FU", "VA", "DU", "SA", "HZ"],
    other: ["PO", "SQ", "FC", "SS", "DS"],
    all: {}
};

[
    weather.specifier,
    weather.nature,
    weather.rain,
    weather.visibility,
    weather.other
].forEach(function(attributes) {
    attributes.forEach(function(attr) {
        weather.all[attr] = attr;
    });
});

function asInt(s) {
    return parseInt(s, 10);
}

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

function METAR(metarString) {
    this.fields = metarString.split(" ");
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
    if (this.peek() === "AUTO") {
        this.result.auto = true;
        this.next();
    }
};

var variableWind = /^([0-9]{3})V([0-9]{3})$/;
METAR.prototype.parseWind = function() {
    this.next();
    this.result.wind = {};

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
    if (this.peek() === "CAVOK") {
        this.result.cavok = true;
        this.next();
    }
};

METAR.prototype.parseVisibility = function() {
    if (this.result.cavok) return;
    this.next();
    if (this.current === "////") {
        this.result.visibility = null;
        return;
    }
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



function sliceWeatherAttribute(s) {
    return weather.all[s.slice(0, 1)] || weather.all[s.slice(0, 2)];
}

METAR.prototype.parseWeather = function() {
    if (this.result.cavok) return;
    if (!sliceWeatherAttribute(this.peek())) return;
    this.next();
    this.result.weather = [];
    this.parseWeatherAttribute();
};

METAR.prototype.parseWeatherAttribute = function() {
    var attr = sliceWeatherAttribute(this.current);
    if (attr) {
        this.result.weather.push(attr);
        this.current = this.current.slice(attr.length);
        this.parseWeatherAttribute();
    }
};


METAR.prototype.parseClouds = function() {
    if (this.result.cavok) return;
    var cloud = parseAbbreviation(this.peek(), CLOUDS);
    if (!cloud) return;

    this.next();

    cloud.height = asInt(this.current.slice(cloud.abbreviation.length))*100 || null;

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


module.exports = function(metarString) {
    var m = new METAR(metarString);
    m.parse();
    return m.result;
};
