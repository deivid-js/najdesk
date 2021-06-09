import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-community/async-storage';

export default async function getUserInfo() {
  const deviceId = DeviceInfo.getUniqueId();
  const deviceModel = DeviceInfo.getModel();
  const deviceOSVersion = DeviceInfo.getSystemVersion();

  const oneSignalId = await AsyncStorage.getItem(
    '@NAJ_AC/one_signal_device_id',
  );

  return {
    deviceId,
    oneSignalId,
    deviceModel,
    deviceOSVersion,
  };
}
