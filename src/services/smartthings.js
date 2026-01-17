/**
 * SmartThings API Service
 * Handles all communication with the Samsung SmartThings REST API
 */

const SMARTTHINGS_API_BASE = 'https://api.smartthings.com/v1';

class SmartThingsService {
  constructor(token) {
    this.token = token;
    // Cache storage
    this.devicesCache = { data: null, timestamp: 0 };
    this.statusCache = new Map(); // Map<deviceId, { data: object, timestamp: number }>
    
    // Cache configuration
    this.CACHE_TTL = {
      DEVICES: 10 * 60 * 1000, // 10 minutes
      STATUS: 1 * 60 * 1000    // 1 minute
    };
  }

  setToken(token) {
    this.token = token;
    this.clearCache();
  }

  clearCache() {
    this.devicesCache = { data: null, timestamp: 0 };
    this.statusCache.clear();
  }

  async request(endpoint, options = {}) {
    if (!this.token) {
      throw new Error('SmartThings token not configured');
    }

    const url = `${SMARTTHINGS_API_BASE}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`SmartThings API error: ${endpoint}`, error);
      throw error;
    }
  }

  // ========== Devices ==========

  async getDevices(forceRefresh = false) {
    const now = Date.now();
    const isCacheValid = this.devicesCache.data && (now - this.devicesCache.timestamp < this.CACHE_TTL.DEVICES);

    if (!forceRefresh && isCacheValid) {
      return this.devicesCache.data || [];
    }

    const data = await this.request('/devices');
    const devices = data.items || [];
    
    this.devicesCache = {
      data: devices,
      timestamp: now
    };
    
    return devices;
  }

  async getDevice(deviceId) {
    return this.request(`/devices/${deviceId}`);
  }

  async getDeviceStatus(deviceId, forceRefresh = false) {
    const now = Date.now();
    const cached = this.statusCache.get(deviceId);
    const isCacheValid = cached && (now - cached.timestamp < this.CACHE_TTL.STATUS);

    if (!forceRefresh && isCacheValid) {
      return cached.data;
    }

    const status = await this.request(`/devices/${deviceId}/status`);
    
    this.statusCache.set(deviceId, {
      data: status,
      timestamp: now
    });

    return status;
  }

  async getDeviceHealth(deviceId) {
    return this.request(`/devices/${deviceId}/health`);
  }

  async executeCommand(deviceId, capability, command, args = []) {
    // Invalidate cache for this device immediately
    this.statusCache.delete(deviceId);

    return this.request(`/devices/${deviceId}/commands`, {
      method: 'POST',
      body: JSON.stringify({
        commands: [{
          component: 'main',
          capability,
          command,
          arguments: args
        }]
      })
    });
  }

  // ========== Common Device Commands ==========

  async toggleSwitch(deviceId, state) {
    const command = state ? 'on' : 'off';
    return this.executeCommand(deviceId, 'switch', command);
  }

  async setLevel(deviceId, level) {
    return this.executeCommand(deviceId, 'switchLevel', 'setLevel', [level]);
  }

  async setColor(deviceId, hue, saturation) {
    return this.executeCommand(deviceId, 'colorControl', 'setColor', [{ hue, saturation }]);
  }

  async setColorTemperature(deviceId, temperature) {
    return this.executeCommand(deviceId, 'colorTemperature', 'setColorTemperature', [temperature]);
  }

  async setThermostatMode(deviceId, mode) {
    return this.executeCommand(deviceId, 'thermostatMode', 'setThermostatMode', [mode]);
  }

  async setHeatingSetpoint(deviceId, temperature) {
    return this.executeCommand(deviceId, 'thermostatHeatingSetpoint', 'setHeatingSetpoint', [temperature]);
  }

  async setCoolingSetpoint(deviceId, temperature) {
    return this.executeCommand(deviceId, 'thermostatCoolingSetpoint', 'setCoolingSetpoint', [temperature]);
  }

  async lockDoor(deviceId) {
    return this.executeCommand(deviceId, 'lock', 'lock');
  }

  async unlockDoor(deviceId) {
    return this.executeCommand(deviceId, 'lock', 'unlock');
  }

  // ========== Scenes ==========

  async getScenes() {
    const data = await this.request('/scenes');
    return data.items || [];
  }

  async executeScene(sceneId) {
    return this.request(`/scenes/${sceneId}/execute`, {
      method: 'POST'
    });
  }

  // ========== Locations ==========

  async getLocations() {
    const data = await this.request('/locations');
    return data.items || [];
  }

  async getLocation(locationId) {
    return this.request(`/locations/${locationId}`);
  }

  // ========== Rooms ==========

  async getRooms(locationId) {
    const data = await this.request(`/locations/${locationId}/rooms`);
    return data.items || [];
  }
}

module.exports = SmartThingsService;
