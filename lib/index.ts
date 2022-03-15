import { u } from 'unist-builder';
import { x } from 'xastscript';
import type { Element } from 'xast';
import type { Root, Folder } from '@tmcw/togeojson';
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import { toXml } from 'xast-util-to-xml';

type F = Feature<Geometry | null>;

const BR = u('text', '\n');
const TAB = u('text', '  ');

type Literal = typeof BR;

/**
 * Convert nested folder structure to KML. This expects
 * input that follows the same patterns as [toGeoJSON](https://github.com/placemark/togeojson)'s
 * kmlWithFolders method: a tree of folders and features,
 * starting with a root element.
 */
export function foldersToKML(root: Root): string {
  return toXml(
    u('root', [
      x(
        'kml',
        { xmlns: 'http://www.opengis.net/kml/2.2' },
        x(
          'Document',
          root.children.flatMap((child) => convertChild(child))
        )
      ),
    ])
  );
}

/**
 * Convert a GeoJSON FeatureCollection to a string of
 * KML data.
 */
export function toKML(
  featureCollection: FeatureCollection<Geometry | null>
): string {
  return toXml(
    u('root', [
      x(
        'kml',
        { xmlns: 'http://www.opengis.net/kml/2.2' },
        x(
          'Document',
          featureCollection.features.flatMap((feature) =>
            convertFeature(feature)
          )
        )
      ),
    ])
  );
}

function convertChild(child: F | Folder) {
  switch (child.type) {
    case 'Feature':
      return convertFeature(child);
    case 'folder':
      return convertFolder(child);
  }
}

function convertFolder(folder: Folder): Array<Literal | Element> {
  return [
    BR,
    x('Folder', [
      BR,
      ...folderMeta(folder.meta),
      BR,
      TAB,
      ...folder.children.flatMap((child) => convertChild(child)),
    ]),
  ];
}

const META_PROPERTIES: Array<keyof Folder['meta']> = [
  'address',
  'description',
  'name',
  'open',
  'visibility',
  'phoneNumber',
];

function folderMeta(meta: Folder['meta']): Element[] {
  return META_PROPERTIES.filter((p) => meta[p] !== undefined).map((p) => {
    return x(p, [u('text', String(meta[p]))]);
  });
}

function convertFeature(feature: F) {
  return [
    BR,
    x('Placemark', [
      BR,
      ...propertiesToTags(feature.properties),
      BR,
      TAB,
      ...(feature.geometry ? [convertGeometry(feature.geometry)] : []),
    ]),
  ];
}

function join(position: Position): string {
  return `${position[0]},${position[1]}`;
}

function coord1(coordinates: Position): Element {
  return x('coordinates', [u('text', join(coordinates))]);
}

function coord2(coordinates: Position[]): Element {
  return x('coordinates', [u('text', coordinates.map(join).join('\n'))]);
}

function propertiesToTags(properties: Feature['properties']): Element[] {
  if (!properties) return [];
  const { name, description, ...otherProperties } = properties;
  return [
    name && x('name', [u('text', name)]),
    description && x('description', [u('text', description)]),
    x(
      'ExtendedData',
      Object.entries(otherProperties).flatMap(([name, value]) => [
        BR,
        TAB,
        x('Data', { name: name }, [
          x('value', [
            u(
              'text',
              typeof value === 'string' ? value : JSON.stringify(value)
            ),
          ]),
        ]),
      ])
    ),
  ].filter(Boolean);
}

const linearRing = (ring: Position[]): Element =>
  x('LinearRing', [coord2(ring)]);

function convertMultiPoint(geometry: GeoJSON.MultiPoint): Element {
  return x(
    'MultiGeometry',
    geometry.coordinates.flatMap((coordinates) => [
      BR,
      convertGeometry({
        type: 'Point',
        coordinates,
      }),
    ])
  );
}
function convertMultiLineString(geometry: GeoJSON.MultiLineString): Element {
  return x(
    'MultiGeometry',
    geometry.coordinates.flatMap((coordinates) => [
      BR,
      convertGeometry({
        type: 'LineString',
        coordinates,
      }),
    ])
  );
}

function convertMultiPolygon(geometry: GeoJSON.MultiPolygon): Element {
  return x(
    'MultiGeometry',
    geometry.coordinates.flatMap((coordinates) => [
      BR,
      convertGeometry({
        type: 'Polygon',
        coordinates,
      }),
    ])
  );
}

function convertPolygon(geometry: GeoJSON.Polygon): Element {
  const [outerBoundary, ...innerRings] = geometry.coordinates;
  return x('Polygon', [
    BR,
    x('outerBoundaryIs', [BR, TAB, linearRing(outerBoundary)]),
    ...innerRings.flatMap((innerRing) => [
      BR,
      x('innerBoundaryIs', [BR, TAB, linearRing(innerRing)]),
    ]),
  ]);
}

function convertGeometry(geometry: Geometry): Element {
  switch (geometry.type) {
    case 'Point':
      return x('Point', [coord1(geometry.coordinates)]);
    case 'MultiPoint':
      return convertMultiPoint(geometry);
    case 'LineString':
      return x('LineString', [coord2(geometry.coordinates)]);
    case 'MultiLineString':
      return convertMultiLineString(geometry);
    case 'Polygon':
      return convertPolygon(geometry);
    case 'MultiPolygon':
      return convertMultiPolygon(geometry);
    case 'GeometryCollection':
      return x(
        'MultiGeometry',
        geometry.geometries.flatMap((geometry) => [
          BR,
          convertGeometry(geometry),
        ])
      );
  }
}
