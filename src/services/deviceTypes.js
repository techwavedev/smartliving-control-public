/**
 * Device Type Definitions
 * Maps SmartThings capabilities to UI controls and icons
 */

const DEVICE_TYPES = {
  tv: {
    type: 'tv',
    icon: '📺',
    label: 'TV',
    capabilities: ['switch', 'audioVolume', 'mediaPlayback', 'mediaInputSource'],
    controls: ['toggle', 'volume', 'media'],
    getStatus: (status) => ({
      isOn: status?.components?.main?.switch?.switch?.value === 'on',
      volume: status?.components?.main?.audioVolume?.volume?.value,
      mute: status?.components?.main?.audioVolume?.mute?.value === 'muted',
      input: status?.components?.main?.mediaInputSource?.inputSource?.value
    })
  },

  switch: {
    type: 'switch',
    icon: '💡',
    label: 'Switch',
    capabilities: ['switch'],
    controls: ['toggle'],
    getStatus: (status) => ({
      isOn: status?.components?.main?.switch?.switch?.value === 'on'
    })
  },

  light: {
    type: 'light',
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
    type: 'dimmer',
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
    type: 'thermostat',
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
    type: 'lock',
    icon: '🔒',
    label: 'Lock',
    capabilities: ['lock'],
    controls: ['lock'],
    getStatus: (status) => ({
      isLocked: status?.components?.main?.lock?.lock?.value === 'locked'
    })
  },

  motionSensor: {
    type: 'motionSensor',
    icon: '👁️',
    label: 'Motion Sensor',
    capabilities: ['motionSensor'],
    controls: [],
    getStatus: (status) => ({
      motion: status?.components?.main?.motionSensor?.motion?.value === 'active'
    })
  },

  contactSensor: {
    type: 'contactSensor',
    icon: '🚪',
    label: 'Contact Sensor',
    capabilities: ['contactSensor'],
    controls: [],
    getStatus: (status) => ({
      isOpen: status?.components?.main?.contactSensor?.contact?.value === 'open'
    })
  },

  temperatureSensor: {
    type: 'temperatureSensor',
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
    type: 'humiditySensor',
    icon: '💧',
    label: 'Humidity Sensor',
    capabilities: ['relativeHumidityMeasurement'],
    controls: [],
    getStatus: (status) => ({
      humidity: status?.components?.main?.relativeHumidityMeasurement?.humidity?.value
    })
  },

  airConditioner: {
    type: 'airConditioner',
    icon: '❄️',
    label: 'Air Conditioner',
    capabilities: ['switch', 'airConditionerMode', 'airConditionerFanMode', 'fanSpeed', 'fanOscillationMode', 'temperatureMeasurement', 'thermostatCoolingSetpoint', 'custom.airConditionerOptionalMode', 'samsungce.airConditionerLighting', 'samsungce.autoCleaningMode', 'custom.spiMode'],
    controls: ['toggle', 'mode', 'fanSpeed', 'swing', 'windFree', 'temperature', 'advanced'],
    getStatus: (status) => ({
      isOn: status?.components?.main?.switch?.switch?.value === 'on',
      mode: status?.components?.main?.airConditionerMode?.airConditionerMode?.value,
      fanSpeed: status?.components?.main?.fanSpeed?.fanSpeed?.value, // Some use fanSpeed capability
      fanMode: status?.components?.main?.airConditionerFanMode?.fanMode?.value, // Some use airConditionerFanMode
      swing: status?.components?.main?.fanOscillationMode?.fanOscillationMode?.value,
      windFree: status?.components?.main?.['custom.airConditionerOptionalMode']?.acOptionalMode?.value,
      temperature: status?.components?.main?.temperatureMeasurement?.temperature?.value,
      coolingSetpoint: status?.components?.main?.thermostatCoolingSetpoint?.coolingSetpoint?.value,
      lighting: status?.components?.main?.['samsungce.airConditionerLighting']?.lighting?.value,
      autoClean: status?.components?.main?.['samsungce.autoCleaningMode']?.autoCleaningMode?.value,
      spiMode: status?.components?.main?.['custom.spiMode']?.spiMode?.value
    })
  },

  outlet: {
    type: 'outlet',
    icon: '🔌',
    label: 'Outlet',
    capabilities: ['switch', 'powerMeter', 'energyMeter'],
    controls: ['toggle', 'power'],
    getStatus: (status) => ({
      isOn: status?.components?.main?.switch?.switch?.value === 'on',
      power: status?.components?.main?.powerMeter?.power?.value,
      energy: status?.components?.main?.energyMeter?.energy?.value
    })
  },

  other: {
    type: 'other',
    icon: '❓',
    label: 'Other',
    capabilities: [],
    controls: [],
    getStatus: () => ({})
  }
};

/**
 * Determine device type from capabilities
 */
function getDeviceType(device) {
  const capabilities = device.components?.flatMap(c => c.capabilities?.map(cap => cap.id)) || [];

  // Check for specific device types (order matters - more specific first)
  if (capabilities.includes('powerMeter') && capabilities.includes('switch')) {
    return DEVICE_TYPES.outlet;
  }
  if (capabilities.includes('airConditionerMode')) {
    return DEVICE_TYPES.airConditioner;
  }
  if (capabilities.includes('audioVolume') || capabilities.includes('mediaPlayback')) {
    return DEVICE_TYPES.tv;
  }
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
  return DEVICE_TYPES.other;
}

// Export for both Node.js and Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEVICE_TYPES, getDeviceType };
} else {
  window.DeviceTypes = { DEVICE_TYPES, getDeviceType };
}
