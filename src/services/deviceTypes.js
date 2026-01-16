/**
 * Device Type Definitions
 * Maps SmartThings capabilities to UI controls and icons
 */

const DEVICE_TYPES = {
  switch: {
    icon: '💡',
    label: 'Switch',
    capabilities: ['switch'],
    controls: ['toggle'],
    getStatus: (status) => ({
      isOn: status?.components?.main?.switch?.switch?.value === 'on'
    })
  },

  light: {
    icon: '💡',
    label: 'Light',
    capabilities: ['switch', 'switchLevel', 'colorControl', 'colorTemperature'],
    controls: ['toggle', 'brightness', 'color'],
    getStatus: (status) => ({
      isOn: status?.components?.main?.switch?.switch?.value === 'on',
      level: status?.components?.main?.switchLevel?.level?.value || 0,
      hue: status?.components?.main?.colorControl?.hue?.value,
      saturation: status?.components?.main?.colorControl?.saturation?.value,
      colorTemperature: status?.components?.main?.colorTemperature?.colorTemperature?.value
    })
  },

  dimmer: {
    icon: '🔆',
    label: 'Dimmer',
    capabilities: ['switch', 'switchLevel'],
    controls: ['toggle', 'brightness'],
    getStatus: (status) => ({
      isOn: status?.components?.main?.switch?.switch?.value === 'on',
      level: status?.components?.main?.switchLevel?.level?.value || 0
    })
  },

  thermostat: {
    icon: '🌡️',
    label: 'Thermostat',
    capabilities: ['thermostatMode', 'thermostatHeatingSetpoint', 'thermostatCoolingSetpoint', 'temperatureMeasurement'],
    controls: ['mode', 'temperature'],
    getStatus: (status) => ({
      mode: status?.components?.main?.thermostatMode?.thermostatMode?.value,
      heatingSetpoint: status?.components?.main?.thermostatHeatingSetpoint?.heatingSetpoint?.value,
      coolingSetpoint: status?.components?.main?.thermostatCoolingSetpoint?.coolingSetpoint?.value,
      temperature: status?.components?.main?.temperatureMeasurement?.temperature?.value
    })
  },

  lock: {
    icon: '🔒',
    label: 'Lock',
    capabilities: ['lock'],
    controls: ['lock'],
    getStatus: (status) => ({
      isLocked: status?.components?.main?.lock?.lock?.value === 'locked'
    })
  },

  motionSensor: {
    icon: '👁️',
    label: 'Motion Sensor',
    capabilities: ['motionSensor'],
    controls: [],
    getStatus: (status) => ({
      motion: status?.components?.main?.motionSensor?.motion?.value === 'active'
    })
  },

  contactSensor: {
    icon: '🚪',
    label: 'Contact Sensor',
    capabilities: ['contactSensor'],
    controls: [],
    getStatus: (status) => ({
      isOpen: status?.components?.main?.contactSensor?.contact?.value === 'open'
    })
  },

  temperatureSensor: {
    icon: '🌡️',
    label: 'Temperature Sensor',
    capabilities: ['temperatureMeasurement'],
    controls: [],
    getStatus: (status) => ({
      temperature: status?.components?.main?.temperatureMeasurement?.temperature?.value,
      unit: status?.components?.main?.temperatureMeasurement?.temperature?.unit || 'C'
    })
  },

  humiditySensor: {
    icon: '💧',
    label: 'Humidity Sensor',
    capabilities: ['relativeHumidityMeasurement'],
    controls: [],
    getStatus: (status) => ({
      humidity: status?.components?.main?.relativeHumidityMeasurement?.humidity?.value
    })
  }
};

/**
 * Determine device type from capabilities
 */
function getDeviceType(device) {
  const capabilities = device.components?.flatMap(c => c.capabilities?.map(cap => cap.id)) || [];

  // Check for specific device types (order matters - more specific first)
  if (capabilities.includes('colorControl')) {
    return DEVICE_TYPES.light;
  }
  if (capabilities.includes('switchLevel') && capabilities.includes('switch')) {
    return DEVICE_TYPES.dimmer;
  }
  if (capabilities.includes('thermostatMode')) {
    return DEVICE_TYPES.thermostat;
  }
  if (capabilities.includes('lock')) {
    return DEVICE_TYPES.lock;
  }
  if (capabilities.includes('motionSensor')) {
    return DEVICE_TYPES.motionSensor;
  }
  if (capabilities.includes('contactSensor')) {
    return DEVICE_TYPES.contactSensor;
  }
  if (capabilities.includes('relativeHumidityMeasurement')) {
    return DEVICE_TYPES.humiditySensor;
  }
  if (capabilities.includes('temperatureMeasurement')) {
    return DEVICE_TYPES.temperatureSensor;
  }
  if (capabilities.includes('switch')) {
    return DEVICE_TYPES.switch;
  }

  // Default fallback
  return {
    icon: '📱',
    label: 'Device',
    capabilities: [],
    controls: [],
    getStatus: () => ({})
  };
}

module.exports = {
  DEVICE_TYPES,
  getDeviceType
};
