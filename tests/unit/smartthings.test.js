/**
 * Unit tests for SmartThingsService
 */

// Mock fetch globally
global.fetch = jest.fn();

const SmartThingsService = require('../../src/services/smartthings');

describe('SmartThingsService', () => {
  let service;
  const mockToken = 'test-token-12345';

  beforeEach(() => {
    service = new SmartThingsService(mockToken);
    jest.clearAllMocks();
  });

  describe('constructor and token management', () => {
    it('should initialize with token', () => {
      expect(service.token).toBe(mockToken);
    });

    it('should update token via setToken', () => {
      const newToken = 'new-token';
      service.setToken(newToken);
      expect(service.token).toBe(newToken);
    });

    it('should throw error when making request without token', async () => {
      service.setToken(null);
      await expect(service.getDevices()).rejects.toThrow('SmartThings token not configured');
    });
  });

  describe('request method', () => {
    it('should make request with correct headers', async () => {
      const mockResponse = { items: [] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await service.request('/devices');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.smartthings.com/v1/devices',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should throw error on non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      await expect(service.request('/devices')).rejects.toThrow('Unauthorized');
    });

    it('should handle API error with no message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({})
      });

      await expect(service.request('/devices')).rejects.toThrow('API error: 500');
    });
  });

  describe('device operations', () => {
    it('should fetch devices list', async () => {
      const mockDevices = [{ deviceId: 'dev1', label: 'Light' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockDevices })
      });

      const devices = await service.getDevices();
      expect(devices).toEqual(mockDevices);
    });

    it('should return empty array when no devices', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const devices = await service.getDevices();
      expect(devices).toEqual([]);
    });

    it('should fetch single device', async () => {
      const mockDevice = { deviceId: 'dev1', label: 'Light' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDevice
      });

      const device = await service.getDevice('dev1');
      expect(device).toEqual(mockDevice);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.smartthings.com/v1/devices/dev1',
        expect.any(Object)
      );
    });

    it('should fetch device status', async () => {
      const mockStatus = { components: { main: { switch: { switch: { value: 'on' } } } } };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      });

      const status = await service.getDeviceStatus('dev1');
      expect(status).toEqual(mockStatus);
    });

    it('should fetch device health', async () => {
      const mockHealth = { state: 'ONLINE' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth
      });

      const health = await service.getDeviceHealth('dev1');
      expect(health).toEqual(mockHealth);
    });
  });

  describe('executeCommand', () => {
    it('should send correct command payload', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ status: 'ACCEPTED' }] })
      });

      await service.executeCommand('dev1', 'switch', 'on', []);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.smartthings.com/v1/devices/dev1/commands',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            commands: [{
              component: 'main',
              capability: 'switch',
              command: 'on',
              arguments: []
            }]
          })
        })
      );
    });
  });

  describe('command helpers', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [{ status: 'ACCEPTED' }] })
      });
    });

    it('should toggle switch on', async () => {
      await service.toggleSwitch('dev1', true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/devices/dev1/commands'),
        expect.objectContaining({
          body: expect.stringContaining('"command":"on"')
        })
      );
    });

    it('should toggle switch off', async () => {
      await service.toggleSwitch('dev1', false);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/devices/dev1/commands'),
        expect.objectContaining({
          body: expect.stringContaining('"command":"off"')
        })
      );
    });

    it('should set level', async () => {
      await service.setLevel('dev1', 75);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/devices/dev1/commands'),
        expect.objectContaining({
          body: expect.stringContaining('"capability":"switchLevel"')
        })
      );
    });

    it('should set color', async () => {
      await service.setColor('dev1', 50, 100);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/devices/dev1/commands'),
        expect.objectContaining({
          body: expect.stringContaining('"capability":"colorControl"')
        })
      );
    });

    it('should lock door', async () => {
      await service.lockDoor('dev1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/devices/dev1/commands'),
        expect.objectContaining({
          body: expect.stringContaining('"command":"lock"')
        })
      );
    });

    it('should unlock door', async () => {
      await service.unlockDoor('dev1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/devices/dev1/commands'),
        expect.objectContaining({
          body: expect.stringContaining('"command":"unlock"')
        })
      );
    });
  });

  describe('scenes', () => {
    it('should fetch scenes list', async () => {
      const mockScenes = [{ sceneId: 'scene1', sceneName: 'Movie Time' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockScenes })
      });

      const scenes = await service.getScenes();
      expect(scenes).toEqual(mockScenes);
    });

    it('should execute scene', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success' })
      });

      await service.executeScene('scene1');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.smartthings.com/v1/scenes/scene1/execute',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('locations and rooms', () => {
    it('should fetch locations', async () => {
      const mockLocations = [{ locationId: 'loc1', name: 'Home' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockLocations })
      });

      const locations = await service.getLocations();
      expect(locations).toEqual(mockLocations);
    });

    it('should fetch single location', async () => {
      const mockLocation = { locationId: 'loc1', name: 'Home' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLocation
      });

      const location = await service.getLocation('loc1');
      expect(location).toEqual(mockLocation);
    });

    it('should fetch rooms for location', async () => {
      const mockRooms = [{ roomId: 'room1', name: 'Living Room' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockRooms })
      });

      const rooms = await service.getRooms('loc1');
      expect(rooms).toEqual(mockRooms);
    });
  });
});
