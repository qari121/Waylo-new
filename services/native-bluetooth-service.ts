import { NativeEventEmitter, NativeModules } from 'react-native';

const { BluetoothModule } = NativeModules;

console.log('🔍 NativeModules:', NativeModules);
console.log('🔍 BluetoothModule from NativeModules:', BluetoothModule);
console.log('🔍 BluetoothModule type:', typeof BluetoothModule);
console.log('🔍 BluetoothModule keys:', BluetoothModule ? Object.keys(BluetoothModule) : 'null');

class NativeBluetoothService {
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: Map<string, any> = new Map();

  constructor() {
    console.log('🏗️ Constructing NativeBluetoothService...');
    console.log('🏗️ BluetoothModule in constructor:', BluetoothModule);
    
    // Only create event emitter if the native module is available
    if (BluetoothModule) {
      console.log('✅ Creating NativeEventEmitter with BluetoothModule');
      this.eventEmitter = new NativeEventEmitter(BluetoothModule);
      console.log('✅ EventEmitter created:', this.eventEmitter);
    } else {
      console.log('❌ BluetoothModule is null, cannot create EventEmitter');
    }
  }

  // Start Bluetooth device discovery
  async startDiscovery(): Promise<boolean> {
    if (!BluetoothModule) {
      throw new Error('Native Bluetooth module not available');
    }
    try {
      return await BluetoothModule.startDiscovery();
    } catch (error) {
      console.error('Native Bluetooth startDiscovery failed:', error);
      throw error;
    }
  }

  // Stop Bluetooth device discovery
  async stopDiscovery(): Promise<boolean> {
    if (!BluetoothModule) {
      throw new Error('Native Bluetooth module not available');
    }
    try {
      return await BluetoothModule.stopDiscovery();
    } catch (error) {
      console.error('Native Bluetooth stopDiscovery failed:', error);
      throw error;
    }
  }

  // Connect to a specific device
  async connectToDevice(deviceId: string): Promise<boolean> {
    if (!BluetoothModule) {
      throw new Error('Native Bluetooth module not available');
    }
    try {
      return await BluetoothModule.connectToDevice(deviceId);
    } catch (error) {
      console.error('Native Bluetooth connectToDevice failed:', error);
      throw error;
    }
  }

  // Disconnect from a specific device
  async disconnectFromDevice(deviceId: string): Promise<boolean> {
    if (!BluetoothModule) {
      throw new Error('Native Bluetooth module not available');
    }
    try {
      return await BluetoothModule.disconnectFromDevice(deviceId);
    } catch (error) {
      console.error('Native Bluetooth disconnectFromDevice failed:', error);
      throw error;
    }
  }

  // Get current Bluetooth state
  async getBluetoothState(): Promise<string> {
    if (!BluetoothModule) {
      throw new Error('Native Bluetooth module not available');
    }
    try {
      return await BluetoothModule.getBluetoothState();
    } catch (error) {
      console.error('Native Bluetooth getBluetoothState failed:', error);
      throw error;
    }
  }

  // Add event listener
  addEventListener(event: string, listener: any): void {
    if (!this.eventEmitter) {
      console.warn('Native Bluetooth event emitter not available');
      return;
    }
    
    if (this.listeners.has(event)) {
      this.listeners.get(event).remove();
    }
    
    const subscription = this.eventEmitter.addListener(event, listener);
    this.listeners.set(event, subscription);
  }

  // Remove all event listeners
  removeAllListeners(): void {
    this.listeners.forEach((subscription) => {
      subscription.remove();
    });
    this.listeners.clear();
  }

  // Check if native module is available
  isAvailable(): boolean {
    const hasModule = BluetoothModule != null;
    const hasEventEmitter = this.eventEmitter != null;
    
    console.log('🔍 isAvailable check:');
    console.log('  - BluetoothModule exists:', hasModule);
    console.log('  - EventEmitter exists:', hasEventEmitter);
    console.log('  - Final result:', hasModule && hasEventEmitter);
    
    return hasModule && hasEventEmitter;
  }
}

export default new NativeBluetoothService();
