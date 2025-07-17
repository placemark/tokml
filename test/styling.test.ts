import { describe, it, expect } from 'vitest';
import { toKML, foldersToKML } from '../lib/index';
import type { Geometry } from 'geojson';

describe('KML Styling', () => {
  describe('toKML with color properties', () => {
    it('should create style for feature with color property', () => {
      const result = toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Red Point',
              color: '#ff0000'
            },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            } as Geometry
          }
        ]
      });

      expect(result).toContain('<Style id="style_0">');
      expect(result).toContain('<LineStyle>');
      expect(result).toContain('<color>ffff0000</color>');
      expect(result).toContain('<PolyStyle>');
      expect(result).toContain('<styleUrl>#style_0</styleUrl>');
    });

    it('should convert different hex colors correctly', () => {
      const testColors = [
        { hex: '#ff0000', kml: 'ffff0000' }, // red
        { hex: '#00ff00', kml: 'ff00ff00' }, // green
        { hex: '#0000ff', kml: 'ff0000ff' }, // blue
        { hex: '#ffffff', kml: 'ffffffff' }, // white
        { hex: '#000000', kml: 'ff000000' }, // black
        { hex: '#ff00ff', kml: 'ffff00ff' }, // magenta
        { hex: '#00ffff', kml: 'ff00ffff' }, // cyan
        { hex: '#ffff00', kml: 'ffffff00' }, // yellow
      ];

      testColors.forEach(({ hex, kml }, index) => {
        const result = toKML({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                name: `Color ${hex}`,
                color: hex
              },
              geometry: {
                type: 'Point',
                coordinates: [0, 0]
              } as Geometry
            }
          ]
        });

        expect(result).toContain(`<color>${kml}</color>`);
        expect(result).toContain('<styleUrl>#style_0</styleUrl>');
      });
    });

    it('should create multiple styles for multiple features with colors', () => {
      const result = toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Red Feature',
              color: '#ff0000'
            },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          },
          {
            type: 'Feature',
            properties: {
              name: 'Blue Feature',
              color: '#0000ff'
            },
            geometry: {
              type: 'LineString',
              coordinates: [[0, 0], [1, 1]]
            } as Geometry
          },
          {
            type: 'Feature',
            properties: {
              name: 'Green Feature',
              color: '#00ff00'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
            } as Geometry
          }
        ]
      });

      // Should have 3 styles
      expect(result).toContain('<Style id="style_0">');
      expect(result).toContain('<Style id="style_1">');
      expect(result).toContain('<Style id="style_2">');
      
      // Should have 3 styleUrl references
      expect(result).toContain('<styleUrl>#style_0</styleUrl>');
      expect(result).toContain('<styleUrl>#style_1</styleUrl>');
      expect(result).toContain('<styleUrl>#style_2</styleUrl>');
      
      // Should have correct colors
      expect(result).toContain('<color>ffff0000</color>'); // red
      expect(result).toContain('<color>ff0000ff</color>'); // blue
      expect(result).toContain('<color>ff00ff00</color>'); // green
    });

    it('should handle features without colors alongside features with colors', () => {
      const result = toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'No Color Feature'
            },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          },
          {
            type: 'Feature',
            properties: {
              name: 'Red Feature',
              color: '#ff0000'
            },
            geometry: {
              type: 'Point',
              coordinates: [1, 1]
            } as Geometry
          }
        ]
      });

      // Should have only 1 style (for the red feature)
      expect(result).toContain('<Style id="style_1">');
      expect(result).not.toContain('<Style id="style_0">');
      
      // First feature should not have styleUrl
      const firstPlacemark = result.split('<Placemark>')[1];
      expect(firstPlacemark).not.toContain('<styleUrl>');
      
      // Second feature should have styleUrl
      const secondPlacemark = result.split('<Placemark>')[2];
      expect(secondPlacemark).toContain('<styleUrl>#style_1</styleUrl>');
    });

    it('should work with all geometry types', () => {
      const geometryTypes: Geometry[] = [
        {
          type: 'Point',
          coordinates: [0, 0]
        },
        {
          type: 'LineString',
          coordinates: [[0, 0], [1, 1]]
        },
        {
          type: 'Polygon',
          coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        },
        {
          type: 'MultiPoint',
          coordinates: [[0, 0], [1, 1]]
        },
        {
          type: 'MultiLineString',
          coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]]
        },
        {
          type: 'MultiPolygon',
          coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]]
        }
      ];

      geometryTypes.forEach((geometry, index) => {
        const result = toKML({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                name: `${geometry.type} Feature`,
                color: '#ff0000'
              },
              geometry
            }
          ]
        });

        expect(result).toContain('<Style id="style_0">');
        expect(result).toContain('<styleUrl>#style_0</styleUrl>');
        expect(result).toContain('<color>ffff0000</color>');
      });
    });
  });

  describe('foldersToKML with color properties', () => {
    it('should create styles for features with colors in folders', () => {
      const result = foldersToKML({
        type: 'root',
        children: [
          {
            type: 'Feature',
            properties: {
              name: 'Root Red Feature',
              color: '#ff0000'
            },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          },
          {
            type: 'folder',
            meta: { name: 'Test Folder' },
            children: [
              {
                type: 'Feature',
                properties: {
                  name: 'Folder Blue Feature',
                  color: '#0000ff'
                },
                geometry: {
                  type: 'LineString',
                  coordinates: [[0, 0], [1, 1]]
                }
              }
            ]
          }
        ]
      });

      // Should have 2 styles
      expect(result).toContain('<Style id="style_0">');
      expect(result).toContain('<Style id="style_1">');
      
      // Should have correct colors
      expect(result).toContain('<color>ffff0000</color>'); // red
      expect(result).toContain('<color>ff0000ff</color>'); // blue
      
      // Should have styleUrl references
      expect(result).toContain('<styleUrl>#style_0</styleUrl>');
      expect(result).toContain('<styleUrl>#style_1</styleUrl>');
    });

    it('should handle nested folders with colors', () => {
      const result = foldersToKML({
        type: 'root',
        children: [
          {
            type: 'folder',
            meta: { name: 'Parent Folder' },
            children: [
              {
                type: 'folder',
                meta: { name: 'Child Folder' },
                children: [
                  {
                    type: 'Feature',
                    properties: {
                      name: 'Nested Green Feature',
                      color: '#00ff00'
                    },
                    geometry: {
                      type: 'Point',
                      coordinates: [0, 0]
                    }
                  }
                ]
              }
            ]
          }
        ]
      });

      expect(result).toContain('<Style id="style_0">');
      expect(result).toContain('<color>ff00ff00</color>'); // green
      expect(result).toContain('<styleUrl>#style_0</styleUrl>');
    });

    it('should maintain correct style indexing across folders', () => {
      const result = foldersToKML({
        type: 'root',
        children: [
          {
            type: 'Feature',
            properties: {
              name: 'First Feature',
              color: '#ff0000'
            },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          },
          {
            type: 'folder',
            meta: { name: 'Folder 1' },
            children: [
              {
                type: 'Feature',
                properties: {
                  name: 'Second Feature',
                  color: '#00ff00'
                },
                geometry: {
                  type: 'Point',
                  coordinates: [1, 1]
                }
              }
            ]
          },
          {
            type: 'Feature',
            properties: {
              name: 'Third Feature',
              color: '#0000ff'
            },
            geometry: {
              type: 'Point',
              coordinates: [2, 2]
            } as Geometry
          }
        ]
      });

      // Should have 3 styles with correct indexing
      expect(result).toContain('<Style id="style_0">');
      expect(result).toContain('<Style id="style_1">');
      expect(result).toContain('<Style id="style_2">');
      
      // Should maintain correct color order
      expect(result).toContain('<color>ffff0000</color>'); // red
      expect(result).toContain('<color>ff00ff00</color>'); // green
      expect(result).toContain('<color>ff0000ff</color>'); // blue
    });
  });

  describe('Edge cases', () => {
    it('should handle empty color string', () => {
      const result = toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Empty Color',
              color: ''
            },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      });

      // Should not create style for empty color
      expect(result).not.toContain('<Style id="style_0">');
      expect(result).not.toContain('<styleUrl>');
    });

    it('should handle null color', () => {
      const result = toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Null Color',
              color: null
            },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      });

      // Should not create style for null color
      expect(result).not.toContain('<Style id="style_0">');
      expect(result).not.toContain('<styleUrl>');
    });

    it('should handle undefined color', () => {
      const result = toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Undefined Color',
              color: undefined
            },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      });

      // Should not create style for undefined color
      expect(result).not.toContain('<Style id="style_0">');
      expect(result).not.toContain('<styleUrl>');
    });

    it('should handle malformed hex colors gracefully', () => {
      const malformedColors = ['#ff', '#gggggg', 'red', '#12345', '#1234567'];
      
      malformedColors.forEach(color => {
        const result = toKML({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                name: 'Malformed Color',
                color: color
              },
              geometry: {
                type: 'Point',
                coordinates: [0, 0]
              } as Geometry
            }
          ]
        });

        // Should still create style but color conversion might be unexpected
        expect(result).toContain('<Style id="style_0">');
        expect(result).toContain('<styleUrl>#style_0</styleUrl>');
      });
    });

    it('should handle features with null geometry and color', () => {
      const result = toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'No Geometry',
              color: '#ff0000'
            },
            geometry: null
          }
        ]
      });

      // Should still create style even without geometry
      expect(result).toContain('<Style id="style_0">');
      expect(result).toContain('<styleUrl>#style_0</styleUrl>');
    });
  });

  describe('Style structure validation', () => {
    it('should create valid KML style structure', () => {
      const result = toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Test Feature',
              color: '#ff0000'
            },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      });

      // Check that style comes before placemark
      const styleIndex = result.indexOf('<Style id="style_0">');
      const placemarkIndex = result.indexOf('<Placemark>');
      expect(styleIndex).toBeLessThan(placemarkIndex);
      
      // Check complete style structure
      expect(result).toContain('<Style id="style_0">');
      expect(result).toContain('<LineStyle>');
      expect(result).toContain('<color>ffff0000</color>');
      expect(result).toContain('</LineStyle>');
      expect(result).toContain('<PolyStyle>');
      expect(result).toContain('</PolyStyle>');
      expect(result).toContain('</Style>');
    });

    it('should include both LineStyle and PolyStyle in each style', () => {
      const result = toKML({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              name: 'Test Feature',
              color: '#00ff00'
            },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      });

      // Extract the style section
      const styleStart = result.indexOf('<Style id="style_0">');
      const styleEnd = result.indexOf('</Style>') + '</Style>'.length;
      const styleSection = result.substring(styleStart, styleEnd);

      // Should contain both LineStyle and PolyStyle
      expect(styleSection).toContain('<LineStyle>');
      expect(styleSection).toContain('</LineStyle>');
      expect(styleSection).toContain('<PolyStyle>');
      expect(styleSection).toContain('</PolyStyle>');
      
      // Both should have the same color
      const lineColorMatch = styleSection.match(/<LineStyle>[\s\S]*?<color>([^<]+)<\/color>/);
      const polyColorMatch = styleSection.match(/<PolyStyle>[\s\S]*?<color>([^<]+)<\/color>/);
      
      expect(lineColorMatch).toBeTruthy();
      expect(polyColorMatch).toBeTruthy();
      expect(lineColorMatch![1]).toBe('ff00ff00');
      expect(polyColorMatch![1]).toBe('ff00ff00');
    });
  });
});