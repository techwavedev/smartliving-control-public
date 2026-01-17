/**
 * Unit tests for deviceTypes module (Updated)
 */

const { CAPABILITIES, getDeviceTypeInfo, hasCapability } = require('../../src/services/deviceTypes');

describe('deviceTypes', () => {
  describe('CAPABILITIES', () => {
    it('should have expected capabilities defined', () => {
      expect(CAPABILITIES.SWITCH).toBe('switch');
      expect(CAPABILITIES.SWITCH_LEVEL).toBe('switchLevel');
      expect(CAPABILITIES.COLOR_CONTROL).toBe('colorControl');
      expect(CAPABILITIES.THERMOSTAT_MODE).toBe('thermostatMode');
      expect(CAPABILITIES.LOCK).toBe('lock');
      expect(CAPABILITIES.MOTION_SENSOR).toBe('motionSensor');
      expect(CAPABILITIES.CONTACT_SENSOR).toBe('contactSensor');
      expect(CAPABILITIES.PRESENCE_SENSOR).toBe('presenceSensor');
      expect(CAPABILITIES.BATTERY).toBe('battery');
    });
  });

  describe('getDeviceTypeInfo', () => {
    it('should identify lock', () => {
      const device = {
        components: [{ capabilities: [{ id: CAPABILITIES.LOCK }] }]
      };
      const info = getDeviceTypeInfo(device);
      expect(info.type).toBe('lock');
      expect(info.icon).toBe('🔒');
    });

    it('should identify thermostat', () => {
      const device = {
        components: [{ capabilities: [{ id: CAPABILITIES.THERMOSTAT_MODE }] }]
      };
      const info = getDeviceTypeInfo(device);
      expect(info.type).toBe('thermostat');
      expect(info.icon).toBe('🌡️');
    });

    it('should identify color light', () => {
      const device = {
        components: [{ capabilities: [{ id: CAPABILITIES.COLOR_CONTROL }] }]
      };
      const info = getDeviceTypeInfo(device);
      expect(info.type).toBe('colorLight');
      expect(info.icon).toBe('💡');
    });

    it('should identify dimmer', () => {
      const device = {
        components: [{ capabilities: [{ id: CAPABILITIES.SWITCH_LEVEL }] }]
      };
      const info = getDeviceTypeInfo(device);
      expect(info.type).toBe('dimmer');
      expect(info.icon).toBe('🔆');
    });

    it('should identify motion sensor', () => {
      const device = {
        components: [{ capabilities: [{ id: CAPABILITIES.MOTION_SENSOR }] }]
      };
      const info = getDeviceTypeInfo(device);
      expect(info.type).toBe('motion');
      expect(info.icon).toBe('👁️');
    });

    it('should identify contact sensor', () => {
      const device = {
        components: [{ capabilities: [{ id: CAPABILITIES.CONTACT_SENSOR }] }]
      };
      const info = getDeviceTypeInfo(device);
      expect(info.type).toBe('contact');
      expect(info.icon).toBe('🚪');
    });

    it('should identify presence sensor', () => {
      const device = {
        components: [{ capabilities: [{ id: CAPABILITIES.PRESENCE_SENSOR }] }]
      };
      const info = getDeviceTypeInfo(device);
      expect(info.type).toBe('presence');
      expect(info.icon).toBe('📍');
    });

    it('should identify switch', () => {
      const device = {
        components: [{ capabilities: [{ id: CAPABILITIES.SWITCH }] }]
      };
      const info = getDeviceTypeInfo(device);
      expect(info.type).toBe('switch');
      expect(info.icon).toBe('⚡');
    });

    it('should return unknown for null/undefined device', () => {
      expect(getDeviceTypeInfo(null)).toEqual({ icon: '📱', type: 'unknown' });
      expect(getDeviceTypeInfo(undefined)).toEqual({ icon: '📱', type: 'unknown' });
      expect(getDeviceTypeInfo({})).toEqual({ icon: '📱', type: 'unknown' });
    });

    it('should return generic for device with no matching capabilities', () => {
      const device = {
        components: [{ capabilities: [{ id: 'someRandomCapability' }] }]
      };
      const info = getDeviceTypeInfo(device);
      expect(info.type).toBe('generic');
      expect(info.icon).toBe('📱');
    });

    it('should prioritize specific types (order check)', () => {
      // Light with switch capability should be identified as light (color/dimmer), not just switch
      const device = {
        components: [{ 
          capabilities: [
            { id: CAPABILITIES.SWITCH },
            { id: CAPABILITIES.COLOR_CONTROL }
          ] 
        }]
      };
      const info = getDeviceTypeInfo(device);
      expect(info.type).toBe('colorLight');
    });
  });

  describe('hasCapability', () => {
    it('should return true if device has capability', () => {
      const device = {
        components: [{ capabilities: [{ id: 'switch' }] }]
      };
      expect(hasCapability(device, 'switch')).toBe(true);
    });

    it('should return false if device does not have capability', () => {
      const device = {
        components: [{ capabilities: [{ id: 'switch' }] }]
      };
      expect(hasCapability(device, 'lock')).toBe(false);
    });

    it('should return false for invalid device', () => {
      expect(hasCapability(null, 'switch')).toBe(false);
      expect(hasCapability({}, 'switch')).toBe(false);
    });
  });
});
