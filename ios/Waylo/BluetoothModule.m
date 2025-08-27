#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BluetoothModule, RCTEventEmitter)

RCT_EXTERN_METHOD(startDiscovery:(RCTPromiseResolveBlock)resolve
                              rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopDiscovery:(RCTPromiseResolveBlock)resolve
                              rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(connectToDevice:(NSString *)deviceId
                              resolver:(RCTPromiseResolveBlock)resolve
                              rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(disconnectFromDevice:(NSString *)deviceId
                              resolver:(RCTPromiseResolveBlock)resolve
                              rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getBluetoothState:(RCTPromiseResolveBlock)resolve
                              rejecter:(RCTPromiseRejectBlock)reject)

@end
