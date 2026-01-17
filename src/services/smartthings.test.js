/**
 * SmartThings Service Unit Tests
 */

// Mock fetch globally
global.fetch = jest.fn();

const SmartThingsService = require('./smartthings');

describe('SmartThingsService', () => {
  let service;
  const mockToken = 'test-token-12345';
  
  beforeEach(() => {
    service = new SmartThingsService(mockToken);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with token', () => {
      expect(service.token).toBe(mockToken);
    });

    it('should allow updating token', () => {
      service.setToken('new-token');
      expect(service.token).toBe('new-token');
    });
  });

  describe('request', () => {
    it('should throw error if no token configured', async () => {
      service.setToken(null);
      await expect(service.request('/devices')).rejects.toThrow('SmartThings token not configured');
    });

    it('should make authenticated requests', async () => {
      const mockResponse = { items: [] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
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

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' })
      });

      await expect(service.request('/devices')).rejects.toThrow('Unauthorized');
    });
  });

  describe('getDevices', () => {
    it('should return device list', async () => {
      const mockDevices = [
        { deviceId: '1', label: 'Light 1' },
        { deviceId: '2', label: 'Light 2' }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockDevices })
      });

      const devices = await service.getDevices();
      expect(devices).toEqual(mockDevices);
    });

    it('should return empty array when no devices', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const devices = await service.getDevices();
      expect(devices).toEqual([]);
    });
  });

  describe('executeCommand', () => {
    it('should send command with correct format', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [{ status: 'ACCEPTED' }] })
      });

      await service.executeCommand('device-1', 'switch', 'on', []);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.smartthings.com/v1/devices/device-1/commands',
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

  describe('toggleSwitch', () => {
    it('should turn switch on', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      await service.toggleSwitch('device-1', true);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"command":"on"')
        })
      );
    });

    it('should turn switch off', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      await service.toggleSwitch('device-1', false);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"command":"off"')
        })
      );
    });
  });

  describe('scenes', () => {
    it('should get scenes', async () => {
      const mockScenes = [{ sceneId: '1', sceneName: 'Good Morning' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: mockScenes })
      });

      const scenes = await service.getScenes();
      expect(scenes).toEqual(mockScenes);
    });

    it('should execute scene', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      await service.executeScene('scene-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.smartthings.com/v1/scenes/scene-1/execute',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
