import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toKML, setLoggerConfig } from '../lib/index';
import type { Geometry } from 'geojson';

describe('Logging functionality', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };
  
  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    // Reset logger config
    setLoggerConfig({ enabled: false, level: 'info' });
  });

  it('should not log when logging is disabled', () => {
    setLoggerConfig({ enabled: false });
    
    toKML({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Test', color: '#ff0000' },
          geometry: { type: 'Point', coordinates: [0, 0] } as Geometry
        }
      ]
    });

    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.warn).not.toHaveBeenCalled();
  });

  it('should log info messages when enabled', () => {
    setLoggerConfig({ enabled: true, level: 'info' });
    
    toKML({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Test', color: '#ff0000' },
          geometry: { type: 'Point', coordinates: [0, 0] } as Geometry
        }
      ]
    });

    expect(consoleSpy.info).toHaveBeenCalledWith(
      '[tokml:info] Starting toKML conversion',
      { featuresCount: 1 }
    );
    expect(consoleSpy.info).toHaveBeenCalledWith(
      '[tokml:info] Conversion completed',
      { stylesGenerated: 1, featuresProcessed: 1 }
    );
  });

  it('should log debug messages when debug level is enabled', () => {
    setLoggerConfig({ enabled: true, level: 'debug' });
    
    toKML({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Test', color: '#ff0000' },
          geometry: { type: 'Point', coordinates: [0, 0] } as Geometry
        }
      ]
    });

    expect(consoleSpy.debug).toHaveBeenCalledWith(
      '[tokml:debug] Created style for feature',
      { index: 0, color: '#ff0000' }
    );
    expect(consoleSpy.debug).toHaveBeenCalledWith(
      '[tokml:debug] Converting color to KML format',
      expect.objectContaining({
        index: 0,
        originalColor: '#ff0000',
        kmlColor: 'ffff0000',
        styleId: 'style_0'
      })
    );
  });

  it('should log warnings for invalid colors', () => {
    setLoggerConfig({ enabled: true, level: 'warn' });
    
    toKML({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Test', color: 'invalid' },
          geometry: { type: 'Point', coordinates: [0, 0] } as Geometry
        }
      ]
    });

    expect(consoleSpy.warn).toHaveBeenCalledWith(
      '[tokml:warn] Invalid color format detected',
      { index: 0, color: 'invalid', expected: '#RRGGBB' }
    );
  });

  it('should respect log level hierarchy', () => {
    setLoggerConfig({ enabled: true, level: 'warn' });
    
    toKML({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Test', color: '#ff0000' },
          geometry: { type: 'Point', coordinates: [0, 0] } as Geometry
        }
      ]
    });

    // Should not log info or debug messages when level is warn
    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.debug).not.toHaveBeenCalled();
  });

  it('should log feature without color property', () => {
    setLoggerConfig({ enabled: true, level: 'debug' });
    
    toKML({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Test' },
          geometry: { type: 'Point', coordinates: [0, 0] } as Geometry
        }
      ]
    });

    expect(consoleSpy.debug).toHaveBeenCalledWith(
      '[tokml:debug] No color property found for feature',
      { index: 0 }
    );
  });

  it('should log feature conversion details', () => {
    setLoggerConfig({ enabled: true, level: 'debug' });
    
    toKML({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'test-feature',
          properties: { name: 'Test', color: '#00ff00' },
          geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } as Geometry
        }
      ]
    });

    expect(consoleSpy.debug).toHaveBeenCalledWith(
      '[tokml:debug] Converting feature',
      {
        index: 0,
        featureId: 'test-feature',
        geometryType: 'LineString',
        hasColor: true
      }
    );

    expect(consoleSpy.debug).toHaveBeenCalledWith(
      '[tokml:debug] Added style reference to feature',
      { index: 0, styleId: 'style_0' }
    );
  });

  it('should handle multiple features with mixed colors', () => {
    setLoggerConfig({ enabled: true, level: 'debug' });
    
    toKML({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Valid Color', color: '#ff0000' },
          geometry: { type: 'Point', coordinates: [0, 0] } as Geometry
        },
        {
          type: 'Feature',
          properties: { name: 'No Color' },
          geometry: { type: 'Point', coordinates: [1, 1] } as Geometry
        },
        {
          type: 'Feature',
          properties: { name: 'Invalid Color', color: '#xyz' },
          geometry: { type: 'Point', coordinates: [2, 2] } as Geometry
        }
      ]
    });

    // Should log creation of valid style
    expect(consoleSpy.debug).toHaveBeenCalledWith(
      '[tokml:debug] Created style for feature',
      { index: 0, color: '#ff0000' }
    );

    // Should log no color found
    expect(consoleSpy.debug).toHaveBeenCalledWith(
      '[tokml:debug] No color property found for feature',
      { index: 1 }
    );

    // Should log invalid color warning
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      '[tokml:warn] Invalid color format detected',
      { index: 2, color: '#xyz', expected: '#RRGGBB' }
    );
  });

  it('should log configuration updates', () => {
    setLoggerConfig({ enabled: true, level: 'info' });
    
    // Clear previous calls
    consoleSpy.info.mockClear();
    
    setLoggerConfig({ level: 'debug' });

    expect(consoleSpy.info).toHaveBeenCalledWith(
      '[tokml:info] Logger configuration updated',
      { enabled: true, level: 'debug' }
    );
  });
});