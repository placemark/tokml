# tokml

Convert GeoJSON to KML.

## Install

This package is [`@placemarkio/tokml`](https://www.npmjs.com/package/@placemarkio/tokml)

## [📕 API Documentation](https://placemark.github.io/tokml/)

Notes:

- This method does not validate the GeoJSON inputs. Invalid FeatureCollections
  may produce an exception.
- GeoJSON properties can have any kind of value, including objects and arrays.
  KML properties are strings. Any non-string GeoJSON properties will be stringified
  with JSON.stringify when converting to KML.
