var assert = require("assert");
var {parseRVR} = require("../metar");

describe("RVR parser", function() {
    it("can handle null", function() {
        var m = parseRVR(null);
        assert.equal(null, m.runway);
    });

    it("can handle empty string", function() {
        var m = parseRVR("");
        assert.equal(null, m.runway);
    });

    it("can parse runway", function() {
        var m = parseRVR("R34/0300U");
        assert.equal("R34", m.runway);
    });

    it("can parse runway approach direction Left", function() {
        var m = parseRVR("R34L/0300U");
        assert.equal("L", m.direction);
    });

    it("can parse runway approach direction Right", function() {
        var m = parseRVR("R34R/0300U");
        assert.equal("R", m.direction);
    });

    it("can parse runway approach direction Center", function() {
        var m = parseRVR("R34C/0300U");
        assert.equal("C", m.direction);
    });

    it("can parse runway seperator", function() {
        var m = parseRVR("R34L/0300U");
        assert.equal("/", m.seperator);
    });

    it("can parse runway min indicator", function() {
        var m = parseRVR("R34L/P0300U");
        assert.equal("P", m.minIndicator);
    });

    it("can parse runway min value (non variable)", function() {
        var m = parseRVR("R34L/0300U");
        assert.equal("0300", m.minValue);
    });

    it("can parse runway min/max and variable value", function() {
        var m = parseRVR("R34L/M0600V1000FT");
        assert.equal("0600", m.minValue);
        assert.equal("V", m.variableIndicator);
        assert.equal("1000", m.maxValue);
    });

    it("can parse runway trend D", function() {
        var m = parseRVR("R34L/0300D");
        assert.equal("D", m.trend);
    });

    it("can parse runway trend N", function() {
        var m = parseRVR("R34L/0300N");
        assert.equal("N", m.trend);
    });

    it("can parse runway trend U", function() {
        var m = parseRVR("R34L/0300U");
        assert.equal("U", m.trend);
    });

    it("can parse units of measure", function() {
        var m = parseRVR("R34L/M0600V1000FT");
        assert.equal("FT", m.unitsOfMeasure);
    });
});
