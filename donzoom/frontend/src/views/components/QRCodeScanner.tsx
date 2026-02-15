import {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import CloseButton from '@/assets/closeButton.svg';
import {useNavigation} from '@react-navigation/native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

function QRCodeScanner({navigation}: any) {
  const [scaned, setScaned] = useState<boolean>(true);
  const [hasCameraPermission, setHasCameraPermission] =
    useState<boolean>(false);
  const ref = useRef(null);

  useEffect(() => {
    const requestCameraPermission = async () => {
      const result = await request(PERMISSIONS.ANDROID.CAMERA);
      if (result === RESULTS.GRANTED) {
        setHasCameraPermission(true);
      } else {
        Alert.alert('카메라 권한이 필요합니다.');
      }
    };
    requestCameraPermission();
  });

  const onBarCodeRead = (event: any) => {
    console.log('Scanned event: ', event);
    if (!scaned) return;
    setScaned(false);
    Vibration.vibrate(100);
    const qrData = JSON.parse(event.nativeEvent.codeStringValue);
    const account = qrData.accountNumber;
    const bank = qrData.bank;

    console.log('이건가? 계좌번호: ', account);
    console.log('은행: ', bank);

    setScaned(true);
    navigation.navigate('송금', {accountNo: account});
  };

  return (
    <View style={styles.container}>
      {hasCameraPermission ? (
        <Camera
          style={styles.scanner}
          ref={ref}
          cameraType={CameraType.Back}
          scanBarcode
          showFrame={true}
          laserColor="rgba(0,0,0,0)"
          surfaceColor="rgba(0,0,0,0)"
          onReadCode={onBarCodeRead}
        />
      ) : (
        // <Text>카메라 권한이 필요합니다.</Text>
        <View></View>
      )}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}>
        <CloseButton width={30} height={30} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  scanner: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 20,
  },
});

export default QRCodeScanner;
