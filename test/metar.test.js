/*global it:true, describe:true */
var assert = require("assert");
var parseMetar = require("../metar");

describe("METAR parser", function() {
    it("can parse type", function() {
        var m = parseMetar("SPECI EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal("SPECI", m.type);

        m = parseMetar("METAR EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal("METAR", m.type);

        m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal("METAR", m.type);
    });

    it("can parse station", function() {
        var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal("EFJY", m.station);
    });

    it("can parse time of observation", function() {
        var m = parseMetar("EFJY 181750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal(18, m.time.getUTCDate());
        assert.equal(17, m.time.getUTCHours());
        assert.equal(50, m.time.getUTCMinutes());
    });

    it("can parse auto", function() {
        var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal(true, m.auto);
    });

    it("can parse correction", function() {
        var m = parseMetar(
            "CYZF 241700Z CCA 32012G18KT 12SM BKN007 OVC042 M02/M05 A2956"
        );
        assert.equal("A", m.correction);

        m = parseMetar("PAOM 302353Z COR 32005KT 10SM CLR M03/M09 A2993");
        assert.equal(true, m.correction);

        m = parseMetar(
            "KCNO 302353Z COR 25013KT 10SM FEW180 23/14 A2994 RMK AO2 SLP133 T02330139 10306 20217 55002"
        );
        assert.equal(true, m.correction);

        // The correction can appear here too
        m = parseMetar("METAR COR EFUT 060620Z 01008KT CAVOK M10/M12 Q1021=");
        expect(m.correction).toEqual(true);

        // Just assert that the values are parsed
        expect(m.dewpoint).toEqual(-12);
        expect(m.wind).toEqual({
            direction: 10,
            gust: null,
            speed: 8,
            unit: "KT",
            variation: null,
        });
    });

    it("can parse metar without auto", function() {
        var m = parseMetar("EFJY 171750Z 29007KT CAVOK 15/12 Q1006");
        assert.equal(290, m.wind.direction);
        assert(!m.auto);
    });

    it("can parse CAVOK", function() {
        var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
        assert.equal(true, m.cavok);
    });

    describe("for winds", function() {
        it("can parse direction", function() {
            var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
            assert.equal(290, m.wind.direction);
        });
        it("can parse speed", function() {
            var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
            assert.equal(7, m.wind.speed);
            assert.equal("KT", m.wind.unit);
        });
        it("can parse variable directions", function() {
            var m = parseMetar(
                "EFHF 171820Z AUTO 29007KT 240V330 CAVOK 15/11 Q1010"
            );
            assert.deepEqual({min: 240, max: 330}, m.wind.variation);
        });
        it("can parse small variable directions", function() {
            var m = parseMetar("EFVA 171850Z AUTO VRB02KT CAVOK 15/11 Q1008");
            assert.equal(2, m.wind.speed);
            assert.equal(true, m.wind.variation);
            assert.equal("VRB", m.wind.direction);
        });
        it("can parse gusts", function() {
            var m = parseMetar(
                "EFVA 171850Z AUTO 24028G42KT CAVOK 15/11 Q1008"
            );
            assert.equal(28, m.wind.speed);
            assert(!m.wind.variation);
            assert.equal(240, m.wind.direction);
            assert.equal(42, m.wind.gust);
        });

        it("can parse MPH speed", function() {
            var m = parseMetar(
                "ULLI 172030Z 23004MPS 9999 -SHRA SCT022CB BKN043 OVC066 13/10 Q1010 NOSIG"
            );
            assert.equal(4, m.wind.speed);
            assert.equal("MPS", m.wind.unit);
        });
    });

    describe("for visibility", function() {
        it("parses no visibility for CAVOK", function() {
            var m = parseMetar("EFJY 171750Z AUTO 29007KT CAVOK 15/12 Q1006");
            assert(!m.visibility);
        });
        it("can parse visibility", function() {
            var m = parseMetar(
                "EFET 171920Z AUTO 04007KT 010V070 9999 OVC035 09/05 Q1009"
            );
            assert.equal(9999, m.visibility);
        });
        it("can skip missing visibility", function() {
            var m = parseMetar(
                "EFHF 172050Z AUTO 26003KT //// SKC 13/10 Q1012"
            );
            assert.equal(null, m.visibility);
            assert.deepEqual(
                [
                    {
                        abbreviation: "SKC",
                        meaning: "sky clear",
                        cumulonimbus: false,
                        altitude: null,
                    },
                ],
                m.clouds
            );
        });
        it("can parse visibility directional variation", function() {
            var m = parseMetar(
                "EFJY 201120Z 30001KT 9999 1500NW -SN SCT002 BKN007 M17/M18 Q1031"
            );
            assert.equal(9999, m.visibility);
            assert.equal("1500", m.visibilityVariation);
            assert.equal("NW", m.visibilityVariationDirection);
        });

        it("can parse clouds with a direction thing?", () => {
            var m = parseMetar(
                "EFJY 201120Z 30001KT 9999 1500NW -SN SCT002 BKN007 M17/M18 Q1031"
            );
            expect(m.clouds).toEqual([
                {
                    abbreviation: "SCT",
                    altitude: 200,
                    cumulonimbus: false,
                    meaning: "scattered",
                },
                {
                    abbreviation: "BKN",
                    altitude: 700,
                    cumulonimbus: false,
                    meaning: "broken",
                },
            ]);
        });
    });

    describe("for weather conditions", function() {
        it("can parse it", function() {
            var m = parseMetar(
                "EFKI 171950Z 00000KT 9999 MIFG FEW012 SCT200 10/10 Q1006"
            );
            assert.deepEqual(
                [
                    {abbreviation: "MI", meaning: "shallow"},
                    {abbreviation: "FG", meaning: "fog"},
                ],
                m.weather
            );
        });
        it("can parse single attribute weather", function() {
            var m = parseMetar(
                "EFKI 172020Z AUTO 00000KT 2600 BR SKC 09/09 Q1006"
            );
            assert.deepEqual(
                [{abbreviation: "BR", meaning: "mist"}],
                m.weather
            );
        });
        it("can parse three attribute weather", function() {
            var m = parseMetar(
                "ULLI 172030Z 23004MPS 9999 -SHRA SCT022CB BKN043 OVC066 13/10 Q1010 NOSIG"
            );
            assert.deepEqual(
                [
                    {abbreviation: "-", meaning: "light intensity"},
                    {abbreviation: "SH", meaning: "showers"},
                    {abbreviation: "RA", meaning: "rain"},
                ],
                m.weather
            );
        });

        it("can parse multiple weather conditions", function() {
            var m = parseMetar(
                "EFJY 092120Z AUTO 05003KT 9999 -SHRA VCSH SCT006 OVC028CB 13/13 Q1014"
            );
            assert.deepEqual(
                [
                    {abbreviation: "-", meaning: "light intensity"},
                    {abbreviation: "SH", meaning: "showers"},
                    {abbreviation: "RA", meaning: "rain"},
                    {abbreviation: "VC", meaning: "in the vicinity"},
                    {abbreviation: "SH", meaning: "showers"},
                ],
                m.weather
            );

            assert.deepEqual(m.clouds.length, 2);
        });
    });

    describe("for clouds", function() {
        it("can parse single cloud level", function() {
            var m = parseMetar(
                "EFET 171920Z AUTO 04007KT 010V070 9999 OVC035 09/05 Q1009"
            );
            assert.deepEqual(
                [
                    {
                        abbreviation: "OVC",
                        meaning: "overcast",
                        cumulonimbus: false,
                        altitude: 3500,
                    },
                ],
                m.clouds
            );
        });

        it("can parse no cloud", function() {
            // "//////" Element not available from an automated observation.
            var m = parseMetar(
                "EFVA 171520Z AUTO 31010KT 270V340 9999 ////// 09/03 Q1009"
            );
            assert.deepEqual(null, m.clouds);
        });

        it("can parse cloud with second directional visibility", function() {
            var m = parseMetar(
                "EFJY 201120Z 30001KT 9999 1500NW -SN SCT002 BKN007 M17/M18 Q1031"
            );

            assert.deepEqual(
                {
                    abbreviation: "SCT",
                    meaning: "scattered",
                    cumulonimbus: false,
                    altitude: 200,
                },
                m.clouds[0]
            );

            assert.deepEqual(
                {
                    abbreviation: "BKN",
                    meaning: "broken",
                    cumulonimbus: false,
                    altitude: 700,
                },
                m.clouds[1]
            );
        });

        it("can parse multiple cloud levels", function() {
            var m = parseMetar(
                "EFVR 171950Z AUTO 27006KT 220V310 9999 FEW012 SCT015 BKN060 13/12 Q1006"
            );
            assert.deepEqual(
                {
                    abbreviation: "FEW",
                    meaning: "few",
                    cumulonimbus: false,
                    altitude: 1200,
                },
                m.clouds[0]
            );
            assert.deepEqual(
                {
                    abbreviation: "SCT",
                    meaning: "scattered",
                    cumulonimbus: false,
                    altitude: 1500,
                },
                m.clouds[1]
            );
            assert.deepEqual(
                {
                    abbreviation: "BKN",
                    meaning: "broken",
                    cumulonimbus: false,
                    altitude: 6000,
                },
                m.clouds[2]
            );
        });

        it("runway visibility does not break cloud parsing", function() {
            var m = parseMetar(
                "EFJY 082120Z AUTO 00000KT 9999 R30/1300U BKN083 BKN101 15/12 Q1013"
            );
            assert(m.clouds);
        });

        it("can parse without altitude", function() {
            var m = parseMetar(
                "EFKI 172020Z AUTO 00000KT 2600 BR SKC 09/09 Q1006"
            );
            assert.deepEqual(
                [
                    {
                        abbreviation: "SKC",
                        altitude: null,
                        cumulonimbus: false,
                        meaning: "sky clear",
                    },
                ],
                m.clouds
            );

            assert.equal(2600, m.visibility);
        });

        it("can parse NCD (no clouds)", function() {
            var m = parseMetar(
                "EFKA 181750Z AUTO 30007KT //// NCD 16/04 Q1015"
            );
            assert.equal(null, m.visibility);
            assert.deepEqual(
                [
                    {
                        abbreviation: "NCD",
                        altitude: null,
                        cumulonimbus: false,
                        meaning: "no clouds",
                    },
                ],
                m.clouds
            );
        });

        it("can parse NSC (no significant clouds)", function() {
            var m = parseMetar(
                "EFKA 181750Z AUTO 30007KT //// NSC 16/04 Q1015"
            );
            assert.equal(null, m.visibility);
            assert.deepEqual(
                [
                    {
                        abbreviation: "NSC",
                        altitude: null,
                        cumulonimbus: false,
                        meaning: "no significant",
                    },
                ],
                m.clouds
            );
        });

        it("can parse VV", function() {
            var m = parseMetar(
                "EFVR 171950Z AUTO 27006KT 220V310 9999 VV060 13/12 Q1006"
            );
            assert.deepEqual(
                [
                    {
                        abbreviation: "VV",
                        altitude: 6000,
                        cumulonimbus: false,
                        meaning: "vertical visibility",
                    },
                ],
                m.clouds
            );
        });

        it("can parse cumulonimbus", function() {
            var m = parseMetar(
                "EFJY 201050Z AUTO 16007KT 9999 -SHRA OVC060CB 15/09 Q1017"
            );
            assert.deepEqual(
                [
                    {
                        abbreviation: "OVC",
                        altitude: 6000,
                        meaning: "overcast",
                        cumulonimbus: true,
                    },
                ],
                m.clouds
            );
        });
    });

    describe("for temp/dewpoint", function() {
        it("can parse it", function() {
            var m = parseMetar(
                "EFKI 171950Z 00000KT 9999 MIFG FEW012 SCT200 10/11 Q1006"
            );
            assert.equal(10, m.temperature);
            assert.equal(11, m.dewpoint);
        });

        it("can parse neg", function() {
            var m = parseMetar(
                "KLZZ 302355Z AUTO 00000KT 10SM CLR 04/M02 A3029 RMK AO2 T00391018 10070 20031"
            );
            assert.equal(4, m.temperature);
            assert.equal(-2, m.dewpoint);
        });

        it("can parse both neg", function() {
            var m = parseMetar(
                "CYZF 241700Z 32012G18KT 12SM BKN007 OVC042 M02/M03 A2956 RMK SC7SC1 SLP024"
            );
            assert.equal(-2, m.temperature);
            assert.equal(-3, m.dewpoint);
        });
    });

    describe("for altimeter", function() {
        it("can parse inches mercury", function() {
            var m = parseMetar(
                "EFKI 171950Z 00000KT 9999 MIFG FEW012 SCT200 10/11 Q1006"
            );
            assert.equal(1006, m.altimeterInHpa);
        });

        it("can parse hpa", function() {
            var m = parseMetar(
                "KLZZ 302355Z AUTO 00000KT 10SM CLR 04/M02 A3029 RMK AO2 T00391018 10070 20031"
            );
            assert.equal(30.29, m.altimeterInHg);
        });
    });

    describe("for recent significant weather", function() {
        it("can parse Moderate/heavy rain showers [RESHRA]", function() {
            var m = parseMetar(
                "EFKI 171950Z 00000KT 9999 MIFG FEW012 SCT200 10/11 Q1006 RESHRA"
            );
            assert.equal("RESHRA", m.recentSignificantWeather);
            assert.equal(
                "Moderate/heavy rain showers",
                m.recentSignificantWeatherDescription
            );
        });

        it("can parse Auto recent weather Unidentified precipitation", function() {
            var m = parseMetar(
                "EFKI 171950Z 00000KT 9999 MIFG FEW012 SCT200 10/11 Q1006 REUP"
            );
            assert.equal("REUP", m.recentSignificantWeather);
            assert.equal(
                "Unidentified precipitation (AUTO obs. only)",
                m.recentSignificantWeatherDescription
            );
        });

        it("can parse obs without recent weather", function() {
            var m = parseMetar(
                "EFKI 171950Z 00000KT 9999 MIFG FEW012 SCT200 10/11 Q1006="
            );
            assert.equal(null, m.recentSignificantWeather);
            assert.equal(null, m.recentSignificantWeatherDescription);
        });
    });

    describe("for rvr", function() {
        it("runway can be parsed", function() {
            var m = parseMetar(
                "EFJY 082120Z AUTO 00000KT 9999 R30/1300U BKN083 BKN101 15/12 Q1013"
            );
            assert("R30", m.rvr.runway);
            assert("/", m.rvr.seperator);
            assert("1300", m.rvr.minValue);
            assert("U", m.rvr.trend);
        });
    });
});
