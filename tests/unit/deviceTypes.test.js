/**
 * Unit tests for deviceTypes module
 */

const { DEVICE_TYPES, getDeviceType } = require('../../src/services/deviceTypes');

describe('deviceTypes', () => {
  describe('DEVICE_TYPES', () => {
    it('should have all expected device types', () => {
      const expectedTypes = [
        'switch', 'light', 'dimmer', 'thermostat', 'lock',
        'motionSensor', 'contactSensor', 'temperatureSensor', 'humiditySensor'
      ];
      
      expectedTypes.forEach(type => {
        expect(DEVICE_TYPES[type]).toBeDefined();
        expect(DEVICE_TYPES[type].icon).toBeDefined();
        expect(DEVICE_TYPES[type].label).toBeDefined();
        expect(DEVICE_TYPES[type].capabilities).toBeInstanceOf(Array);
        expect(DEVICE_TYPES[type].controls).toBeInstanceOf(Array);
        expect(DEVICE_TYPES[type].getStatus).toBeInstanceOf(Function);
      });
    });
  });

  describe('getDeviceType', () => {
    it('should return light type for colorControl capability', () => {
      const device = {
        components: [{
          capabilities: [{ id: 'colorControl' }, { id: 'switch' }]
        }]
      };
      
      const result = getDeviceType(device);
      expect(result).toBe(DEVICE_TYPES.light);
    });

    it('should return dimmer type for switchLevel + switch', () => {
      const device = {
        components: [{
          capabilities: [{ id: 'switchLevel' }, { id: 'switch' }]
        }]
      };
      
      const result = getDeviceType(device);
      expect(result).toBe(DEVICE_TYPES.dimmer);
    });

    it('should return thermostat type for thermostatMode', () => {
      const device = {
        components: [{
          capabilities: [{ id: 'thermostatMode' }]
        }]
      };
      
      const result = getDeviceType(device);
      expect(result).toBe(DEVICE_TYPES.thermostat);
    });

    it('should return lock type for lock capability', () => {
      const device = {
        components: [{
          capabilities: [{ id: 'lock' }]
        }]
      };
      
      const result = getDeviceType(device);
      expect(result).toBe(DEVICE_TYPES.lock);
    });

    it('should return motionSensor type', () => {
      const device = {
        components: [{
          capabilities: [{ id: 'motionSensor' }]
        }]
      };
      
      const result = getDeviceType(device);
      expect(result).toBe(DEVICE_TYPES.motionSensor);
    });

    it('should return contactSensor type', () => {
      const device = {
        components: [{
          capabilities: [{ id: 'contactSensor' }]
        }]
      };
      
      const result = getDeviceType(device);
      expect(result).toBe(DEVICE_TYPES.contactSensor);
    });

    it('should return humiditySensor type', () => {
      const device = {
        components: [{
          capabilities: [{ id: 'relativeHumidityMeasurement' }]
        }]
      };
      
      const result = getDeviceType(device);
      expect(result).toBe(DEVICE_TYPES.humiditySensor);
    });

    it('should return temperatureSensor type', () => {
      const device = {
        components: [{
          capabilities: [{ id: 'temperatureMeasurement' }]
        }]
      };
      
      const result = getDeviceType(device);
      expect(result).toBe(DEVICE_TYPES.temperatureSensor);
    });

    it('should return switch type for basic switch', () => {
      const device = {
        components: [{
          capabilities: [{ id: 'switch' }]
        }]
      };
      
      const result = getDeviceType(device);
      expect(result).toBe(DEVICE_TYPES.switch);
    });

    it('should return fallback for unknown device', () => {
      const device = {
        components: [{
          capabilities: [{ id: 'unknownCapability' }]
        }]
      };
      
      const result = getDeviceType(device);
      expect(result.icon).toBe('📱');
      expect(result.label).toBe('Device');
    });

    it('should handle device with no components', () => {
      const device = {};
      
      const result = getDeviceType(device);
      expect(result.icon).toBe('📱');
    });

    it('should handle device with empty components', () => {
      const device = { components: [] };
      
      const result = getDeviceType(device);
      expect(result.icon).toBe('📱');
    });
  });

  describe('getStatus functions', () => {
    describe('switch', () => {
      it('should parse on state', () => {
        const status = {
          components: { main: { switch: { switch: { value: 'on' } } } }
        };
        
        const result = DEVICE_TYPES.switch.getStatus(status);
        expect(result.isOn).toBe(true);
      });

      it('should parse off state', () => {
        const status = {
          components: { main: { switch: { switch: { value: 'off' } } } }
        };
        
        const result = DEVICE_TYPES.switch.getStatus(status);
        expect(result.isOn).toBe(false);
      });

      it('should handle null status', () => {
        const result = DEVICE_TYPES.switch.getStatus(null);
        expect(result.isOn).toBeFalsy();
      });
    });

    describe('light', () => {
      it('should parse full light status', () => {
        const status = {
          components: {
            main: {
              switch: { switch: { value: 'on' } },
              switchLevel: { level: { value: 75 } },
              colorControl: { hue: { value: 50 }, saturation: { value: 100 } },
              colorTemperature: { colorTemperature: { value: 4000 } }
            }
          }
        };
        
        const result = DEVICE_TYPES.light.getStatus(status);
        expect(result.isOn).toBe(true);
        expect(result.level).toBe(75);
        expect(result.hue).toBe(50);
        expect(result.saturation).toBe(100);
        expect(result.colorTemperature).toBe(4000);
      });
    });

    describe('dimmer', () => {
      it('should parse dimmer status', () => {
        const status = {
          components: {
            main: {
              switch: { switch: { value: 'on' } },
              switchLevel: { level: { value: 50 } }
            }
          }
        };
        
        const result = DEVICE_TYPES.dimmer.getStatus(status);
        expect(result.isOn).toBe(true);
        expect(result.level).toBe(50);
      });

      it('should default level to 0', () => {
        const status = {
          components: { main: { switch: { switch: { value: 'on' } } } }
        };
        
        const result = DEVICE_TYPES.dimmer.getStatus(status);
        expect(result.level).toBe(0);
      });
    });

    describe('thermostat', () => {
      it('should parse thermostat status', () => {
        const status = {
          components: {
            main: {
              thermostatMode: { thermostatMode: { value: 'heat' } },
              thermostatHeatingSetpoint: { heatingSetpoint: { value: 21 } },
              thermostatCoolingSetpoint: { coolingSetpoint: { value: 24 } },
              temperatureMeasurement: { temperature: { value: 20 } }
            }
          }
        };
        
        const result = DEVICE_TYPES.thermostat.getStatus(status);
        expect(result.mode).toBe('heat');
        expect(result.heatingSetpoint).toBe(21);
        expect(result.coolingSetpoint).toBe(24);
        expect(result.temperature).toBe(20);
      });
    });

    describe('lock', () => {
      it('should parse locked state', () => {
        const status = {
          components: { main: { lock: { lock: { value: 'locked' } } } }
        };
        
        const result = DEVICE_TYPES.lock.getStatus(status);
        expect(result.isLocked).toBe(true);
      });

      it('should parse unlocked state', () => {
        const status = {
          components: { main: { lock: { lock: { value: 'unlocked' } } } }
        };
        
        const result = DEVICE_TYPES.lock.getStatus(status);
        expect(result.isLocked).toBe(false);
      });
    });

    describe('sensors', () => {
      it('should parse motion sensor', () => {
        const status = {
          components: { main: { motionSensor: { motion: { value: 'active' } } } }
        };
        
        const result = DEVICE_TYPES.motionSensor.getStatus(status);
        expect(result.motion).toBe(true);
      });

      it('should parse contact sensor', () => {
        const status = {
          components: { main: { contactSensor: { contact: { value: 'open' } } } }
        };
        
        const result = DEVICE_TYPES.contactSensor.getStatus(status);
        expect(result.isOpen).toBe(true);
      });

      it('should parse temperature sensor', () => {
        const status = {
          components: { main: { temperatureMeasurement: { temperature: { value: 22, unit: 'C' } } } }
        };
        
        const result = DEVICE_TYPES.temperatureSensor.getStatus(status);
        expect(result.temperature).toBe(22);
        expect(result.unit).toBe('C');
      });

      it('should parse humidity sensor', () => {
        const status = {
          components: { main: { relativeHumidityMeasurement: { humidity: { value: 65 } } } }
        };
        
        const result = DEVICE_TYPES.humiditySensor.getStatus(status);
        expect(result.humidity).toBe(65);
      });
    });
  });
});
