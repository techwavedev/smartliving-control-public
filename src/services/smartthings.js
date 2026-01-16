/**
 * SmartThings API Service
 * Handles all communication with the Samsung SmartThings REST API
 */

const SMARTTHINGS_API_BASE = 'https://api.smartthings.com/v1';

class SmartThingsService {
  constructor(token) {
    this.token = token;
  }

  setToken(token) {
    this.token = token;
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

  async getDevices() {
    const data = await this.request('/devices');
    return data.items || [];
  }

  async getDevice(deviceId) {
    return this.request(`/devices/${deviceId}`);
  }

  async getDeviceStatus(deviceId) {
    return this.request(`/devices/${deviceId}/status`);
  }

  async getDeviceHealth(deviceId) {
    return this.request(`/devices/${deviceId}/health`);
  }

  async executeCommand(deviceId, capability, command, args = []) {
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
