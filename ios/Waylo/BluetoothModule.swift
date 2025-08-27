import Foundation
import CoreBluetooth
import React

@objc(BluetoothModule)
class BluetoothModule: RCTEventEmitter {
    private var centralManager: CBCentralManager!
    private var discoveredDevices: [CBPeripheral] = []
    private var isScanning = false
    
    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    override func supportedEvents() -> [String]! {
        return ["BluetoothStateChanged", "DeviceDiscovered", "DeviceConnected", "DeviceDisconnected"]
    }
    
    @objc
    func startDiscovery(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard centralManager.state == .poweredOn else { 
            reject("BLUETOOTH_OFF", "Bluetooth is not powered on", nil); 
            return 
        }
        guard !isScanning else { 
            reject("ALREADY_SCANNING", "Discovery already in progress", nil); 
            return 
        }
        discoveredDevices.removeAll()
        isScanning = true
        centralManager.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
        resolve(true)
    }
    
    @objc
    func stopDiscovery(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard isScanning else { 
            reject("NOT_SCANNING", "Discovery not in progress", nil); 
            return 
        }
        centralManager.stopScan()
        isScanning = false
        resolve(true)
    }
    
    @objc
    func connectToDevice(_ deviceId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let peripheral = discoveredDevices.first(where: { $0.identifier.uuidString == deviceId }) else { 
            reject("DEVICE_NOT_FOUND", "Device not found", nil); 
            return 
        }
        centralManager.connect(peripheral, options: nil)
        resolve(true)
    }
    
    @objc
    func disconnectFromDevice(_ deviceId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let peripheral = discoveredDevices.first(where: { $0.identifier.uuidString == deviceId }) else { 
            reject("DEVICE_NOT_FOUND", "Device not found", nil); 
            return 
        }
        centralManager.cancelPeripheralConnection(peripheral)
        resolve(true)
    }
    
    @objc
    func getBluetoothState(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let state = centralManager.state
        let stateString = bluetoothStateToString(state)
        resolve(stateString)
    }
    
    private func bluetoothStateToString(_ state: CBManagerState) -> String {
        switch state {
        case .unknown: return "Unknown"
        case .resetting: return "Resetting"
        case .unsupported: return "Unsupported"
        case .unauthorized: return "Unauthorized"
        case .poweredOff: return "PoweredOff"
        case .poweredOn: return "PoweredOn"
        @unknown default: return "Unknown"
        }
    }
    
    private func sendDeviceInfo(_ peripheral: CBPeripheral) {
        let deviceInfo: [String: Any] = [
            "id": peripheral.identifier.uuidString,
            "name": peripheral.name ?? "Unknown Device",
            "address": peripheral.identifier.uuidString,
            "rssi": 0,
            "isConnectable": true,
            "state": peripheral.state.rawValue
        ]
        sendEvent(withName: "DeviceDiscovered", body: deviceInfo)
    }
}

extension BluetoothModule: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        let stateString = bluetoothStateToString(central.state)
        sendEvent(withName: "BluetoothStateChanged", body: ["state": stateString])
    }
    
    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        if !discoveredDevices.contains(where: { $0.identifier == peripheral.identifier }) {
            discoveredDevices.append(peripheral)
            var deviceName = peripheral.name ?? "Unknown Device"
            if let localName = advertisementData[CBAdvertisementDataLocalNameKey] as? String {
                deviceName = localName
            }
            let deviceInfo: [String: Any] = [
                "id": peripheral.identifier.uuidString,
                "name": deviceName,
                "address": peripheral.identifier.uuidString,
                "rssi": RSSI.intValue,
                "isConnectable": true,
                "state": peripheral.state.rawValue,
                "advertisementData": advertisementData
            ]
            print("🔍 NATIVE iOS DEVICE DISCOVERED: \(deviceName) - \(peripheral.identifier.uuidString)")
            sendEvent(withName: "DeviceDiscovered", body: deviceInfo)
        }
    }
    
    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        let deviceInfo: [String: Any] = [
            "id": peripheral.identifier.uuidString,
            "name": peripheral.name ?? "Unknown Device"
        ]
        sendEvent(withName: "DeviceConnected", body: deviceInfo)
    }
    
    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        let deviceInfo: [String: Any] = [
            "id": peripheral.identifier.uuidString,
            "name": peripheral.name ?? "Unknown Device"
        ]
        sendEvent(withName: "DeviceDisconnected", body: deviceInfo)
    }
    
    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        print("Failed to connect to \(peripheral.name ?? "Unknown Device"): \(error?.localizedDescription ?? "Unknown error")")
    }
}
