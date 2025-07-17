const { toKML } = require('./dist/tokml.cjs');

// Test simple case
const result = toKML({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Area A',
        color: '#00ff00'
      },
      geometry: { 
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
      },
    },
  ],
});

console.log('Result:', result);