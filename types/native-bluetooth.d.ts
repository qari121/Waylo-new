declare module 'react-native-native-bluetooth' {
  export interface NativeBluetoothDevice {
    id: string;
    name: string;
    address: string;
    rssi: number;
    isConnectable: boolean;
    state: number;
    advertisementData?: any;
  }

  export interface BluetoothStateEvent {
    state: string;
  }

  export interface DeviceEvent {
    id: string;
    name: string;
  }

  export class NativeBluetoothManager {
    static startDiscovery(): Promise<boolean>;
    static stopDiscovery(): Promise<boolean>;
    static connectToDevice(deviceId: string): Promise<boolean>;
    static disconnectFromDevice(deviceId: string): Promise<boolean>;
    static getBluetoothState(): Promise<string>;
    
    static addEventListener(
      event: 'BluetoothStateChanged',
      listener: (event: BluetoothStateEvent) => void
    ): void;
    
    static addEventListener(
      event: 'DeviceDiscovered',
      listener: (event: NativeBluetoothDevice) => void
    ): void;
    
    static addEventListener(
      event: 'DeviceConnected',
      listener: (event: DeviceEvent) => void
    ): void;
    
    static addEventListener(
      event: 'DeviceDisconnected',
      listener: (event: DeviceEvent) => void
    ): void;
    
    static removeAllListeners(event: string): void;
  }
}
