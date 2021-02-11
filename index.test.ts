import { test } from "tap";
import { hexToKmlColor, toKML } from "./";

test("hexToKmlColor", (t) => {
  t.same(hexToKmlColor("123", 1), "ff332211");
  t.same(hexToKmlColor("123", 0.5), "7f332211");
  t.same(hexToKmlColor("123", 0.05), "0c332211");
  t.same(hexToKmlColor("aaccdd", 1), "ffddccaa");
  t.end();
});

test("toKML", (t) => {
  t.same(
    toKML({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            foo: "bar",
          },
          geometry: {
            type: "Point",
            coordinates: [0, 2],
          },
        },
      ],
    }),
    `<kml xmlns=\"http://www.opengis.net/kml/2.2\"><Document><Placemark><Point><coordinates>0, 2</coordinates></Point></Placemark></Document></kml>`
  );
  t.end();
});
