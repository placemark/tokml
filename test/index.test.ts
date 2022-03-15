import { toKML, foldersToKML } from '../lib/index';

describe('foldersToKML', () => {
  it('#foldersToKML', () => {
    expect(
      foldersToKML({
        type: 'root',
        children: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },

            geometry: {
              type: 'Point',
              coordinates: [0, 2],
            },
          },

          {
            type: 'folder',
            meta: { name: 'Hi' },
            children: [],
          },

          {
            type: 'folder',
            meta: { name: 'Hi' },
            children: [
              {
                type: 'Feature',
                properties: {
                  foo: 'bar',
                },

                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [0, 2],
                    [1, 2],
                  ],
                },
              },
            ],
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data></ExtendedData>
        <Point><coordinates>0,2</coordinates></Point></Placemark>
      <Folder>
      <name>Hi</name>
        </Folder>
      <Folder>
      <name>Hi</name>
        
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data></ExtendedData>
        <LineString><coordinates>0,2
      1,2</coordinates></LineString></Placemark></Folder></Document></kml>"
    `);
    expect(
      foldersToKML({
        type: 'root',
        children: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },

            geometry: {
              type: 'Point',
              coordinates: [0, 2],
            },
          },

          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },

            geometry: {
              type: 'LineString',
              coordinates: [
                [0, 2],
                [1, 2],
              ],
            },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data></ExtendedData>
        <Point><coordinates>0,2</coordinates></Point></Placemark>
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data></ExtendedData>
        <LineString><coordinates>0,2
      1,2</coordinates></LineString></Placemark></Document></kml>"
    `);
  });
});

describe('toKML', () => {
  it('#toKML', () => {
    expect(
      toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },

            geometry: {
              type: 'Point',
              coordinates: [0, 2],
            },
          },

          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },

            geometry: {
              type: 'MultiPoint',
              coordinates: [
                [0, 2],
                [1, 2],
              ],
            },
          },

          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },

            geometry: {
              type: 'LineString',
              coordinates: [
                [0, 2],
                [1, 2],
              ],
            },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data></ExtendedData>
        <Point><coordinates>0,2</coordinates></Point></Placemark>
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data></ExtendedData>
        <MultiGeometry>
      <Point><coordinates>0,2</coordinates></Point>
      <Point><coordinates>1,2</coordinates></Point></MultiGeometry></Placemark>
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data></ExtendedData>
        <LineString><coordinates>0,2
      1,2</coordinates></LineString></Placemark></Document></kml>"
    `);

    expect(
      toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },

            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [0, 2],
                  [1, 2],
                  [2, 2],
                  [0, 2],
                ],

                [
                  [0, 3],
                  [1, 3],
                  [2, 3],
                  [0, 3],
                ],
              ],
            },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data></ExtendedData>
        <Polygon>
      <outerBoundaryIs>
        <LinearRing><coordinates>0,2
      1,2
      2,2
      0,2</coordinates></LinearRing></outerBoundaryIs>
      <innerBoundaryIs>
        <LinearRing><coordinates>0,3
      1,3
      2,3
      0,3</coordinates></LinearRing></innerBoundaryIs></Polygon></Placemark></Document></kml>"
    `);

    expect(
      toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },

            geometry: {
              type: 'MultiLineString',
              coordinates: [
                [
                  [0, 2],
                  [1, 2],
                  [2, 2],
                  [0, 2],
                ],

                [
                  [0, 3],
                  [1, 3],
                  [2, 3],
                  [0, 3],
                ],
              ],
            },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data></ExtendedData>
        <MultiGeometry>
      <LineString><coordinates>0,2
      1,2
      2,2
      0,2</coordinates></LineString>
      <LineString><coordinates>0,3
      1,3
      2,3
      0,3</coordinates></LineString></MultiGeometry></Placemark></Document></kml>"
    `);

    expect(
      toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
            },

            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [0, 2],
                    [1, 2],
                    [2, 2],
                    [0, 2],
                  ],

                  [
                    [0, 3],
                    [1, 3],
                    [2, 3],
                    [0, 3],
                  ],
                ],
              ],
            },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data></ExtendedData>
        <MultiGeometry>
      <Polygon>
      <outerBoundaryIs>
        <LinearRing><coordinates>0,2
      1,2
      2,2
      0,2</coordinates></LinearRing></outerBoundaryIs>
      <innerBoundaryIs>
        <LinearRing><coordinates>0,3
      1,3
      2,3
      0,3</coordinates></LinearRing></innerBoundaryIs></Polygon></MultiGeometry></Placemark></Document></kml>"
    `);

    expect(
      toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              foo: 'bar',
              bar: { x: 1 },
              q: 1,
            },

            geometry: {
              type: 'GeometryCollection',
              geometries: [{ type: 'Point', coordinates: [0, 1] }],
            },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <ExtendedData>
        <Data name=\\"foo\\"><value>bar</value></Data>
        <Data name=\\"bar\\"><value>{\\"x\\":1}</value></Data>
        <Data name=\\"q\\"><value>1</value></Data></ExtendedData>
        <MultiGeometry>
      <Point><coordinates>0,1</coordinates></Point></MultiGeometry></Placemark></Document></kml>"
    `);

    expect(
      toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: null,
            geometry: { type: 'Point', coordinates: [0, 1] },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>

        <Point><coordinates>0,1</coordinates></Point></Placemark></Document></kml>"
    `);

    expect(
      toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              description: 'test',
            },

            geometry: { type: 'Point', coordinates: [0, 1] },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <description>test</description><ExtendedData></ExtendedData>
        <Point><coordinates>0,1</coordinates></Point></Placemark></Document></kml>"
    `);

    expect(
      toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'bar',
            },

            geometry: null,
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <name>bar</name><ExtendedData></ExtendedData>
        </Placemark></Document></kml>"
    `);

    expect(
      toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'bar',
            },

            geometry: { type: 'Point', coordinates: [0, 1] },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <name>bar</name><ExtendedData></ExtendedData>
        <Point><coordinates>0,1</coordinates></Point></Placemark></Document></kml>"
    `);
  });

  it('ignores coordinates past #2', () => {
    expect(
      toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'bar',
            },

            geometry: { type: 'Point', coordinates: [0, 1, 2] },
          },
        ],
      })
    ).toMatchInlineSnapshot(`
      "<kml xmlns=\\"http://www.opengis.net/kml/2.2\\"><Document>
      <Placemark>
      <name>bar</name><ExtendedData></ExtendedData>
        <Point><coordinates>0,1</coordinates></Point></Placemark></Document></kml>"
    `);
  });
});
