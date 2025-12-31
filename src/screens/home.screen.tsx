import React, { JSX, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Dimensions } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
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
import { Picker } from '@react-native-picker/picker';
import { axiosInstance } from '../config/axiosInstance';
import Snackbar from 'react-native-snackbar';


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
  const [selectedMealPoints, setSelectedMealPoints] = React.useState<
    number | null
  >(null);
  const [totalPrice, setTotalPrice] = React.useState<number>(0);
  const [selectedMeals, setSelectedMeals] = React.useState<
    Record<number, boolean>
  >({});
  const [manualCode, setManualCode] = React.useState();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [language, setLanguage] = React.useState(i18n.language);

  const navigation = useNavigation();

  const onSuccess = async (e: any) => {

    if (isScanningRef.current) {
      return;
    }

    const code = e?.data;
    if (!code) return;
    isScanningRef.current = true;
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
      setMembership(fullMembership)
      if (!fullMembership) {
      }
      setData(membership);
      setScanning(false);
    } catch (e) {
      Alert.alert(
        t('Error'),
        t('Invalid Code'),
        [{ text: t('OK'), style: 'cancel' }]
      );
    } finally {
      isScanningRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleManualCodeSubmit = () => {
    onSuccess({ data: manualCode });
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
          usedPoints: Math.abs(selectedMealPoints).toString(),
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
  return (
    <View style={styles.centerButton}>
      {
        !scanning && (
          <View style={styles.languageDropdown}>
            <Picker
              selectedValue={language}
              style={{
                width: 120,
                height: 32,
                color: '#000',
                backgroundColor: '#e2e2e2',
              }}
              onValueChange={itemValue => onLanguageChange(itemValue)}>
              <Picker.Item label="EN" value="en" />
              <Picker.Item label="FR" value="fr" />
              <Picker.Item label="ES" value="es" />
            </Picker>
          </View>
        )
      }
      {scanning && (
        <View style={{ width: '100%', marginTop: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 10,
              height: 50,
            }}>
            <Button
              title={t('Back')}
              onPress={() => setScanning(false)}
              color={'#000'}
            />
            <View style={styles.languageDropdownInScanner}>
              <Picker
                selectedValue={language}
                style={{
                  width: 120,
                  height: 32,
                  color: '#000',
                  backgroundColor: '#e2e2e2',
                }}
                onValueChange={itemValue => onLanguageChange(itemValue)}>
                <Picker.Item label="EN" value="en" />
                <Picker.Item label="FR" value="fr" />
                <Picker.Item label="ES" value="es" />
              </Picker>
            </View>
          </View>
          { }
        </View>
      )}

      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {scanning ? (
        <RNCamera
          key={scanning.toString()} // Add key prop to force re-render
          // onRead={onSuccess}
          flashMode={RNCamera.Constants.FlashMode.auto}
          // showMarker={true}
          cameraType="back"
          reactivate={false}
          topContent={
            <Text
              style={{
                textAlign: 'center',
                fontSize: 18,
                color: '#000',
                marginTop: 5,
                marginBottom: 20,
              }}>
              {t('Scan a barcode')}
            </Text>
          }
        />
      ) : data.membership ? (

        <View style={{ marginTop: 20 }}>
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
                minHeight: 100, // allow dynamic height
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
            <Text style={{ color: '#3e3e3e', width: '100%', }}>{t('Amount of the order')}</Text>
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
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: 'transparent',
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderBottomWidth: 1,
                borderColor: '#d1d1d1',
                alignItems: 'center', // vertical centering
              }}>
              <Text style={{ flex: 2, fontWeight: 'bold', fontSize: 16 }}>{t('Name')}</Text>
              <Text style={{ flex: 1.2, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{t('Price')}</Text>
              <Text style={{ flex: 1.2, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{t('Points')}</Text>
              <Text style={{ flex: 1.2, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{t('Action')}</Text>
            </View>
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
                    paddingVertical: selectedMeals[item.id] ? 20 : 14, // + padding si sélectionné
                    paddingHorizontal: selectedMeals[item.id] ? 14 : 10,
                    backgroundColor: selectedMeals[item.id] ? '#f5f5f5' : '#fff',
                    transform: [{ scale: selectedMeals[item.id] ? 1.1 : 1 }],
                    borderBottomWidth: 1,
                    borderColor: '#f0f0f0',
                  }}>
                  <Text style={{ flex: 2, fontSize: 15, }}>{item.label}</Text>
                  <Text style={{ flex: 1.2, fontSize: 15, textAlign: 'center', }}>
                    {data?.restaurant?.currency?.code === 'EUR' && '€'}
                    {data?.restaurant?.currency?.code === 'USD' && '$'}
                    {data?.restaurant?.currency?.code === 'MAD' && 'DH'}
                    {item.price}
                  </Text>

                  <Text style={{ flex: 1.2, fontSize: 15, textAlign: 'center', }}>
                    {item.pointsToBuy}
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#4dc6e2', // Red for Unselect, Blue for Select
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
                  backgroundColor: orderAmount ? '#4dc6e2' : '#c0c0c0', // gris quand désactivé
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
                  setScanning(true);
                  setData({});
                  setOrderAmount('');
                  setSelectedMealPoints(0);
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
            onPress={() => {
              AsyncStorage.clear().then(() => {
                setScanning(true);
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
              onChangeText={text => (isSubmitting ? null : setManualCode(text))}
              aria-disabled={isSubmitting}
            />


            <TouchableOpacity
              style={{
                backgroundColor: !manualCode || isSubmitting ? '#c0c0c0' : '#4dc6e2', // gris quand désactivé
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
    top: 20,
    right: 20,
    zIndex: 1000,
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
});

export default HomeScreen;
