# tokml

Convert GeoJSON to KML.

## API

`toKML(featureCollection: FeatureCollection): string`

This is the main method of this module: provide it with a GeoJSON
FeatureCollection object, and it will return a KML string.

Notes:

- This method does not validate the GeoJSON inputs. Invalid FeatureCollections
  may produce an exception.
- GeoJSON properties can have any kind of value, including objects and arrays.
  KML properties are strings. Any non-string GeoJSON properties will be stringified
  with JSON.stringify when converting to KML.
