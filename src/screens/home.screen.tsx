import React, { JSX, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  StatusBar,
  useColorScheme,
  Button,
  View,
  Alert,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  ActionSheetIOS,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Dimensions } from 'react-native';
import { Camera, useCameraDevices, useCodeScanner } from 'react-native-vision-camera';
import { Animated, Easing } from 'react-native';

const Colors = {
  lighter: '#f6f6f6',
  light: '#ffffff',
  dark: '#000000',
  darker: '#111111',
};

import axios from 'axios';
import { BaseUrl } from '../../src/config/BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { axiosInstance } from '../config/axiosInstance';
import Snackbar from 'react-native-snackbar';
import { SafeAreaView } from 'react-native-safe-area-context';

function HomeScreen(): JSX.Element {
  const { t, i18n } = useTranslation();
  const isDarkMode = useColorScheme() === 'dark';
  const isScanningRef = useRef(false);
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const { width, height } = Dimensions.get('window');

  const [data, setData] = React.useState<Record<string, any>>({});
  const [fullmembership, setMembership] = React.useState<Record<string, any>>({});
  const [scanning, setScanning] = React.useState(false);
  const [orderAmount, setOrderAmount] = React.useState('');
  const [selectedMealPoints, setSelectedMealPoints] = React.useState<number | null>(null);
  const [totalPrice, setTotalPrice] = React.useState<number>(0);
  const [selectedMeals, setSelectedMeals] = React.useState<Record<number, boolean>>({});
  const [manualCode, setManualCode] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [language, setLanguage] = React.useState(i18n.language);
  const navigation = useNavigation();
  const [hasCameraPermission, setHasCameraPermission] = React.useState(false);
  const [flash, setFlash] = React.useState(false);

  const laserPosition = useRef(new Animated.Value(0)).current;

  const devices = useCameraDevices();

  const device = devices.find(d => d.position === 'back');
  const requestCameraPermission = async () => {
    try {
      const status = await Camera.getCameraPermissionStatus();

      if (status === 'authorized' || status === 'granted') {
        setHasCameraPermission(true);
        return true;
      }

      const permission = await Camera.requestCameraPermission();

      if (permission === 'authorized' || permission === 'granted') {
        setHasCameraPermission(true);
        return true;
      }
      Alert.alert(
        t('permission'),
        t('settings'),
        [
          { text: t('Cancel'), style: 'cancel' },
          {
            text: t('openSettings'),
            onPress: () => {
              Linking.openSettings();
            },
          },
        ]
      );

      return false;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };


  useEffect(() => {
    (async () => {
      const status = await Camera.getCameraPermissionStatus();
      setHasCameraPermission(status === 'authorized' || status === 'granted');
    })();
  }, []);
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(laserPosition, {
          toValue: 250,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(laserPosition, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanning]);
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      if (isScanningRef.current) return;
      const value = codes[0]?.value;
      if (!value) return;
      isScanningRef.current = true;
      setScanning(false);
      onSuccess({ data: value });
    },
  });

  const onSuccess = async (e: any) => {
    const code = e?.data;
    if (!code) {
      isScanningRef.current = false;
      return;
    }

    try {
      setIsSubmitting(true);
      Snackbar.show({
        text: t('Code scanned. Verification in progress'),
        duration: Snackbar.LENGTH_SHORT,
      });

      const { data } = await axiosInstance.get(
        BaseUrl + '/restaurantByCode/' + code,
      );

      const { data: membership } = await axiosInstance.get(
        BaseUrl +
        '/restaurant/' +
        data?.membership?.restaurant +
        '/' +
        data?.membership?.user,
      );

      const { data: fullMembership } = await axiosInstance.get(
        `${BaseUrl}/membership/${data?.membership?.user}`,
      );

      setMembership(fullMembership);
      setData(membership);

    } catch (e) {
      Alert.alert(
        t('Error'),
        t('Invalid Code'),
        [{
          text: t('OK'),
          style: 'cancel',
          onPress: () => {
            isScanningRef.current = false;
          }
        }]
      );
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        isScanningRef.current = false;
      }, 1000);
    }
  };

  const startScan = async () => {
    if (isScanningRef.current) return;

    const allowed = await requestCameraPermission();
    console.log('Permission allowed:', allowed);

    if (!allowed) {
      return;
    }

    isScanningRef.current = false;
    setScanning(true);
  };

  const handleManualCodeSubmit = () => {
    if (!manualCode.trim()) return;
    onSuccess({ data: manualCode.trim() });
  };

  const handleMealSelect = (points: number, price: number, id: number, name: string) => {
    setSelectedMeals(prevSelectedMeals => {
      const isSelected = !!prevSelectedMeals[id];
      const newSelectedMeals = { ...prevSelectedMeals, [id]: !isSelected };

      ToastAndroid.show(
        isSelected
          ? t('selection_removed', { name })
          : t('selection_added', { name }),
        ToastAndroid.SHORT
      );


      setTotalPrice(prevPrice => prevPrice + (isSelected ? -price : price));
      setSelectedMealPoints(prevPoints =>
        (prevPoints || 0) + (isSelected ? -points : points),
      );

      setData(prevData => {
        const updatedPoints = isSelected
          ? prevData.membership.points + points
          : prevData.membership.points - points;

        if (updatedPoints < 0) {
          Alert.alert(t('Not enough points to select this meal'));
          return prevData;
        }

        return {
          ...prevData,
          membership: {
            ...prevData.membership,
            points: updatedPoints,
          },
        };
      });

      return newSelectedMeals;
    });
  };

  const handleValidate = () => {
    if (orderAmount) {
      axios
        .post(BaseUrl + '/order/create', {
          price: orderAmount?.toString(),
          userId: data?.membership?.user.toString(),
          restaurantId: data?.restaurant?.id?.toString(),
          usedPoints: selectedMealPoints ? Math.abs(selectedMealPoints).toString() : '0',
        })
        .then(res => {
          Alert.alert(
            t('Order Created Successfully'),
            `${t('New Points Balance')} ${data.membership.points + Number(orderAmount)}`
          );

          setData({});
          setOrderAmount('');
          setSelectedMealPoints(null);
          setTotalPrice(0);
          setSelectedMeals({});
        })
        .catch(err => {
          Alert.alert(
            t('Failed to create order at this moment!, please try again'),
          );
        });
    }
  };

  const onLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const openLanguagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'EN', 'FR', 'ES'],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) onLanguageChange('en');
          if (buttonIndex === 2) onLanguageChange('fr');
          if (buttonIndex === 3) onLanguageChange('es');
        },
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {scanning && device && hasCameraPermission ? (
        <View style={{ flex: 1 }}>
          <View style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }}>
            <TouchableOpacity
              onPress={() => setFlash(prev => !prev)}
              style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: 10,
                borderRadius: 25,
              }}
            >
              <MaterialCommunityIcons
                name={flash ? 'flash' : 'flash-off'}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            codeScanner={codeScanner}
            torch={flash ? 'on' : 'off'}
          />

          <View style={styles.overlay}>
            <View style={styles.scannerWindow}>
              <Animated.View
                style={[
                  styles.laser,
                  { transform: [{ translateY: laserPosition }] },
                ]}
              />
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              isScanningRef.current = false;
              setScanning(false);
            }}
          >
            <Text style={{ color: '#fff' }}>Back</Text>
          </TouchableOpacity>
        </View>
      ) : scanning && !device ? (
        <View style={styles.centerButton}>
          <Text style={{ color: '#000', marginBottom: 20 }}>
            {t('No camera device found')}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#4dc6e2',
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 10,
            }}
            onPress={() => setScanning(false)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {t('Back')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.centerButton}>
          {!scanning && (
            <View style={styles.languageDropdown}>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={openLanguagePicker}
              >
                <Text style={styles.languageText}>
                  {language.toUpperCase()}
                </Text>
                <Icon name="chevron-down" size={14} color="#000" />
              </TouchableOpacity>
            </View>
          )}

          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={backgroundStyle.backgroundColor}
          />

          {data.membership ? (
            <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
              <View style={{ marginTop: 20 }}>
                {/* Membership Code */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  <Text
                    style={{
                      color: 'black',
                      marginTop: 20,
                      marginBottom: 5,
                      flexShrink: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    {t('Membership code:')}{' '}
                    <Text style={{ fontWeight: '900' }}>{data.membership.code}</Text>
                  </Text>
                </View>

                {/* Points Box */}
                <View
                  style={{
                    backgroundColor: '#4dc6e2',
                    borderRadius: 10,
                    minHeight: 100,
                    padding: 20,
                    marginBottom: 20,
                    width: '100%',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      color: '#fff',
                      fontWeight: 'bold',
                      flexWrap: 'wrap',
                    }}
                  >
                    {data.membership.points} {t('Points')}
                  </Text>

                  <Text
                    style={{
                      fontSize: 16,
                      color: '#fff',
                      fontWeight: 'bold',
                      flexWrap: 'wrap',
                      marginTop: 8,
                    }}
                  >
                    {t('Registered on')}
                    {' '}
                    {new Date(fullmembership[0]?.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              <View>
                <Text style={{ color: '#3e3e3e', width: '100%' }}>
                  {t('Amount of the order')}
                </Text>
                <TextInput
                  style={{
                    marginTop: 10,
                    borderWidth: 1,
                    color: '#000',
                    padding: 10,
                    borderRadius: 5,
                    marginBottom: 20,
                  }}
                  value={orderAmount}
                  onChangeText={(text) => {
                    if (/^\d*\.?\d*$/.test(text)) {
                      setOrderAmount(text);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder={t('Enter Order Amount')}
                />

                {/* Meal Selection Table Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: 'transparent',
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderBottomWidth: 1,
                    borderColor: '#d1d1d1',
                    alignItems: 'center',
                  }}>
                  <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 16 }}>
                    {t('Name')}
                  </Text>
                  <Text style={{ flex: 1.2, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                    {t('Price')}
                  </Text>
                  <Text style={{ flex: 1.2, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                    {t('Points')}
                  </Text>
                  <Text style={{ flex: 1.2, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                    {t('Action')}
                  </Text>
                </View>

                {/* Meal List */}
                <FlatList
                  data={data?.restaurant?.menu?.menuGroups
                    ?.flatMap((group: any) => group.meals)
                    ?.filter((meal: any) =>
                      meal.pointsToBuy !== null &&
                      meal.pointsToBuy !== undefined &&
                      meal.pointsToBuy !== ''
                    )}
                  keyExtractor={item => item.id.toString()}
                  style={{ maxHeight: 200 }}
                  nestedScrollEnabled={true}
                  renderItem={({ item }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: selectedMeals[item.id] ? 20 : 14,
                        paddingHorizontal: selectedMeals[item.id] ? 14 : 10,
                        backgroundColor: selectedMeals[item.id] ? '#f5f5f5' : '#fff',
                        transform: [{ scale: selectedMeals[item.id] ? 1.1 : 1 }],
                        borderBottomWidth: 1,
                        borderColor: '#f0f0f0',
                      }}>
                      <Text style={{ flex: 2, fontSize: 15 }}>{item.label}</Text>
                      <Text style={{ flex: 1.2, fontSize: 15, textAlign: 'center' }}>
                        {data?.restaurant?.currency?.code === 'EUR' && '€'}
                        {data?.restaurant?.currency?.code === 'USD' && '$'}
                        {data?.restaurant?.currency?.code === 'MAD' && 'DH'}
                        {item.price}
                      </Text>
                      <Text style={{ flex: 1.2, fontSize: 15, textAlign: 'center' }}>
                        {item.pointsToBuy}
                      </Text>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#4dc6e2',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 30,
                          justifyContent: 'center',
                          alignItems: 'center',
                          elevation: 5,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 6,
                          minWidth: 50,
                          height: 50,
                        }}
                        onPress={() => handleMealSelect(item.pointsToBuy, item.price, item.id, item.label)}>
                        <Icon
                          name={selectedMeals[item.id] ? 'check-circle' : 'times-circle'}
                          size={24}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />

                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      color: 'black',
                      marginTop: 20,
                      marginBottom: 5,
                      flexShrink: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    {t('Total Price:')}{' '}
                    <Text style={{ fontWeight: '900' }}>
                      {data?.restaurant?.currency?.code === 'USD' && '$'}
                      {data?.restaurant?.currency?.code === 'EUR' && '€'}
                      {data?.restaurant?.currency?.code === 'MAD' && 'DH'}
                      {totalPrice}
                    </Text>
                  </Text>
                </View>

                <View style={{ gap: 16 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: orderAmount ? '#4dc6e2' : '#c0c0c0',
                      paddingVertical: 14,
                      borderRadius: 10,
                      alignItems: 'center',
                      opacity: orderAmount ? 1 : 0.6
                    }}
                    onPress={handleValidate}
                    disabled={!orderAmount}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                      {t('Validate')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      backgroundColor: '#4dc6e2',
                      paddingVertical: 14,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setData({});
                      setOrderAmount('');
                      setSelectedMealPoints(0);
                      isScanningRef.current = false;
                      startScan();
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                      {t('Next? Scan again!')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={{
                  backgroundColor: '#4dc6e2',
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
                onPress={async () => {
                  AsyncStorage.clear().then(() => {
                    startScan();
                  });
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  {t('New Order? Scan now!')}
                </Text>
              </TouchableOpacity>

              <View style={{ marginTop: 20, width: '80%' }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    padding: 10,
                    borderRadius: 5,
                    marginBottom: 10,
                  }}
                  placeholder={t('Enter code manually')}
                  value={manualCode}
                  onChangeText={text => !isSubmitting && setManualCode(text)}
                  editable={!isSubmitting}
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: !manualCode || isSubmitting ? '#c0c0c0' : '#4dc6e2',
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity: !manualCode || isSubmitting ? 0.6 : 1
                  }}
                  onPress={handleManualCodeSubmit}
                  disabled={!manualCode || isSubmitting}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    {t('Submit Code')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 10 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#4dc6e2',
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    AsyncStorage.clear().then(() => {
                      navigation.navigate('Login');
                    });
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    {t('Signout')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  languageDropdownInScanner: {
    alignSelf: 'flex-end', // This will make the dropdown align to the right
    marginRight: 10,
  },
  centerButton: {
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageDropdown: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 10000,
    elevation: 20,
  },
  centerText: {
    flex: 1,
    fontSize: 18,
    color: '#777',
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
  pickerContainer: {
    width: 120,
    backgroundColor: '#e2e2e2',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerStyle: {
    width: 120,
    color: '#000',
  },
  pickerItem: {
    color: '#000',
    fontSize: 14,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e2e2e2',
    borderRadius: 20,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerWindow: {
    width: '80%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: '#00FF00', // bright green
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  laser: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#00FF00', // green laser
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: '#00FF00',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: '#00FF00',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#00FF00',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#00FF00',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
  },

});

export default HomeScreen;