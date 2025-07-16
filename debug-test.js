const { toKML } = require('./tokml/dist/tokml.cjs');

const result = toKML({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'styled feature',
        color: '#ff0000'
      },
      geometry: { type: 'Point', coordinates: [0, 1] },
    },
  ],
});

console.log(result);