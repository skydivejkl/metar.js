(function() {

var re = /(R\d{2})([L|R|C])?(\/)([P|M])?(\d+)(?:([V])([P|M])?(\d+))?([N|U|D])?(FT)?/g; 

function RVR(rvrString) {
    this.result = {};
    this.rvrString = rvrString;
    this.parse();
}

RVR.prototype.parse = function() {

    var matches;

    while ((matches = re.exec(this.rvrString)) != null) {

        if (matches.index === re.lastIndex) {
            re.lastIndex++;
        }

        this.result = {
            "runway": matches[1],
            "direction": matches[2],
            "seperator": matches[3],
            "minIndicator": matches[4],
            "minValue": matches[5],
            "variableIndicator": matches[6],
            "maxIndicator": matches[7],
            "maxValue": matches[8],
            "trend": matches[9],
            "unitsOfMeasure": matches[10]
        }
    }

};

function parseRVR(rvrString) {
    var m = new RVR(rvrString);
    m.parse();
    return m.result;
}

if (typeof module !== "undefined") {
    module.exports = parseRVR;
}
else if (typeof window !== "undefined") {
    window.parseMETAR = parseMETAR;
}

}());
