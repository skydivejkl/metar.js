/*global it:true, describe:true */
var assert = require("assert");
var parseMetar = require("../metar");


describe("METAR parser", function() {

    it("can parse station", function(){
        var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal("EFJY", m.station);
    });

    it("can parse time of observation", function(){
        var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal(20, m.time.getHours());
        assert.equal(50, m.time.getMinutes());
    });

    it("can parse auto", function(){
        var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal(true, m.auto);
    });

    it("can parse metar without auto", function() {
        var m = parseMetar("EFJY 171750Z 29007KT CAVOK 15/12 Q1006");
        assert.equal(290, m.wind.direction);
        assert(!m.auto);
    });

    it("can parse CAVOK", function(){
        var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal(true, m.cavok);
    });

    describe("for winds", function() {
        it("can parse direction", function(){
            var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
            assert.equal(290, m.wind.direction);
        });
        it("can parse speed", function(){
            var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
            assert.equal(7, m.wind.speed);
            assert.equal("KT", m.wind.unit);
        });
        it("can parse variable directions", function(){
            var m = parseMetar("EFHF 171820Z AUTO 29007KT 240V330 CAVOK 15/11 Q1010");
            assert.deepEqual({min: 240, max: 330}, m.wind.variation);
        });
        it("can parse small variable directions", function(){
            var m = parseMetar("EFVA 171850Z AUTO VRB02KT CAVOK 15/11 Q1008");
            assert.equal(2, m.wind.speed);
            assert.equal(true, m.wind.variation);
            assert.equal("VRB", m.wind.direction);
        });
        it("can parse gusts", function(){
            var m = parseMetar("EFVA 171850Z AUTO 24028G42KT CAVOK 15/11 Q1008");
            assert.equal(28, m.wind.speed);
            assert(!m.wind.variation);
            assert.equal(240, m.wind.direction);
            assert.equal(42, m.wind.gust);
        });

        it("can MPH speed", function() {
            var m = parseMetar("ULLI 172030Z 23004MPS 9999 -SHRA SCT022CB BKN043 OVC066 13/10 Q1010 NOSIG");
            assert.equal(4, m.wind.speed);
            assert.equal("MPS", m.wind.unit);
        });
    });

    describe("for visibility", function() {
        it("parses no visibility for CAVOK", function(){
            var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
            assert(!m.visibility);
        });
        it("can parse visibility", function(){
            var m = parseMetar("EFET 171920Z AUTO 04007KT 010V070 9999 OVC035 09/05 Q1009");
            assert.equal(9999, m.visibility);
        });
        it("can skip missing visibility", function(){
            var m = parseMetar("EFHF 172050Z AUTO 26003KT //// SKC 13/10 Q1012");
            assert.equal(null, m.visibility);
            assert.deepEqual([{
                abbreviation: "SKC",
                meaning: "sky clear",
                cumulonimbus: false,
                altitude: null
            }], m.clouds);
        });
    });

    describe("for weather conditions", function() {
        it("can parse it", function() {
            var m = parseMetar("EFKI 171950Z 00000KT 9999 MIFG FEW012 SCT200 10/10 Q1006");
            assert.deepEqual([{"abbreviation":"MI","meaning":"shallow"},{"abbreviation":"FG","meaning":"fog"}], m.weather);
        });
        it("can parse single attribute weather", function() {
            var m = parseMetar("EFKI 172020Z AUTO 00000KT 2600 BR SKC 09/09 Q1006");
            assert.deepEqual([{"abbreviation":"BR","meaning":"mist"}], m.weather);
        });
        it("can parse three attribute weather", function() {
            var m = parseMetar("ULLI 172030Z 23004MPS 9999 -SHRA SCT022CB BKN043 OVC066 13/10 Q1010 NOSIG");
            assert.deepEqual([
                {"abbreviation":"-","meaning":"light intensity"},
                {"abbreviation":"SH","meaning":"showers"},
                {"abbreviation":"RA","meaning":"rain"}
                ],m.weather);
        });
    });

    describe("for clouds", function() {
        it("can parse single cloud level", function(){
            var m = parseMetar("EFET 171920Z AUTO 04007KT 010V070 9999 OVC035 09/05 Q1009");
            assert.deepEqual([{
                abbreviation: "OVC",
                meaning: "overcast",
                cumulonimbus: false,
                altitude: 3500
            }], m.clouds);
        });
        it("can parse multiple cloud levels", function(){
            var m = parseMetar("EFVR 171950Z AUTO 27006KT 220V310 9999 FEW012 SCT015 BKN060 13/12 Q1006");
            assert.deepEqual({
                abbreviation: "FEW",
                meaning: "few",
                cumulonimbus: false,
                altitude: 1200
            }, m.clouds[0]);
            assert.deepEqual({
                abbreviation: "SCT",
                meaning: "scattered",
                cumulonimbus: false,
                altitude: 1500
            }, m.clouds[1]);
            assert.deepEqual({
                abbreviation: "BKN",
                meaning: "broken",
                cumulonimbus: false,
                altitude: 6000
            }, m.clouds[2]);
        });

        it("can parse without altitude", function() {
            var m = parseMetar("EFKI 172020Z AUTO 00000KT 2600 BR SKC 09/09 Q1006");
            assert.deepEqual([{
                abbreviation: "SKC",
                altitude: null,
                cumulonimbus: false,
                meaning: "sky clear"
            }], m.clouds);

            assert.equal(2600, m.visibility);

        });

        it("can parse NCD (no clouds)", function(){
            var m = parseMetar("EFKA 181750Z AUTO 30007KT //// NCD 16/04 Q1015");
            assert.equal(null, m.visibility);
            assert.deepEqual([{
                abbreviation:"NCD",
                altitude: null,
                cumulonimbus: false,
                meaning: "no clouds"
            }], m.clouds);
        });

        it("can parse NSC (no significant clouds)", function(){
            var m = parseMetar("EFKA 181750Z AUTO 30007KT //// NSC 16/04 Q1015");
            assert.equal(null, m.visibility);
            assert.deepEqual([{
                abbreviation:"NSC",
                altitude: null,
                cumulonimbus: false,
                meaning:"no significant"
            }], m.clouds);
        });

        it("can parse VV", function(){
            var m = parseMetar("EFVR 171950Z AUTO 27006KT 220V310 9999 VV060 13/12 Q1006");
            assert.deepEqual([{
                abbreviation:"VV",
                altitude: 6000,
                cumulonimbus: false,
                meaning:"vertical visibility"
            }], m.clouds);
        });

        it("can parse cumulonimbus", function(){
            var m = parseMetar("EFJY 201050Z AUTO 16007KT 9999 -SHRA OVC060CB 15/09 Q1017");
            assert.deepEqual([{
                abbreviation: "OVC",
                altitude: 6000,
                meaning: "overcast",
                cumulonimbus: true
            }], m.clouds);
        });

    });

});
