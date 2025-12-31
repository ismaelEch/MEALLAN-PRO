import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from 'react-native';
const Colors = {
  lighter: '#f6f6f6',
  light: '#ffffff',
  dark: '#000000',
  darker: '#111111',
};

import { Accented, Heading } from '../components/formatting.component';
import { Input } from '../components/input.component';

import { XColors } from '../config/constants';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { BaseUrl } from '../config/BaseUrl';

const { width, height } = Dimensions.get('window');

function ForgotPasswordScreen(): JSX.Element {
  const paddingVertical = height * 0.02;
  const paddingHorizontal = width * 0.05;
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const navigation = useNavigation();
  const { t } = useTranslation();

  const backgroundStyle = {
    backgroundColor: Colors.lighter,
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    axios
      .post(BaseUrl + '/users/forgotPassword', { email })
      .then(() => {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            t('Reset link sent to your email address'),
            ToastAndroid.SHORT,
          );
        } else {
          alert(t('Reset link sent to your email address'));
        }
        navigation.navigate('Login');
      })
      .catch(() => {
        if (Platform.OS === 'android') {
          ToastAndroid.show(t('Failed to send reset link'), ToastAndroid.SHORT);
        } else {
          alert(t('Failed to send reset link'));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <View style={{ ...backgroundStyle, ...styles.screen }}>
      {/* Back button */}
      <View style={styles.headerButtonsRight}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <View style={styles.iconButton}>
            <Accented>
              <AntDesign name="arrowleft" size={30} color="black" />
            </Accented>
          </View>
        </TouchableOpacity>
      </View>

      {/* Logo + heading */}
      <View style={styles.centerContent}>
        <Image
          style={{ width: 200, height: 150 }}
          source={require('../../assets/logo.jpg')}
        />
        <Heading level={1}>
          <Text>{t('Forgot Password')}</Text>
        </Heading>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <Input
          icon="mail"
          placeholder={t('Email')}
          textContentType="emailAddress"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={val => setEmail(val)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            borderWidth: 1,
            padding: 12,
            borderRadius: 5,
            borderColor: isFocused ? XColors.accent : '#4dc6e2',
            marginBottom: 10,
          }}
        />

        <View style={{ height: 20 }} />

        {/* Submit button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            onPress={handleForgotPassword}
            activeOpacity={0.7}
            style={{
              backgroundColor: XColors.accent,
              paddingVertical: paddingVertical,
              paddingHorizontal: paddingHorizontal,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 50,
              width: 190,
            }}>
            {isLoading ? (
              <ActivityIndicator color="white" size={20} />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {t('Send reset link')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center' },
  iconButton: {
    width: 45,
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 25,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 0,
    marginTop: 10,
  },
  headerButtonsRight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    zIndex: 9999,
    width: '100%',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ForgotPasswordScreen;
