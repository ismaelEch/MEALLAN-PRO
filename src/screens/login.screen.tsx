import React, { useState } from 'react';
import {
  StyleSheet,
  useColorScheme,
  Text,
  View,
  Alert,
  ToastAndroid,
  TouchableOpacity,
  Platform,
} from 'react-native';
const Colors = {
  lighter: '#f6f6f6',
  light: '#ffffff',
  dark: '#000000',
  darker: '#111111',
};

import { Heading } from '../components/formatting.component';
import { Input, PasswordInput } from '../components/input.component';

import { XColors } from '../config/constants';
import axios from 'axios';
import { BaseUrl } from '../config/BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

function LoginScreen(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = { backgroundColor: isDarkMode ? Colors.darker : Colors.lighter };

  const [password, setPassword] = useState('azerty');
  const [email, setEmail] = useState('ismail.echchikhi@gmail.com');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleLogin = async () => {
    try {
      const response = await axios.post(BaseUrl + '/users/cashier/signin', { email, password });
      if (response.data) {
        await AsyncStorage.setItem('token', response.data);
        navigation.navigate('Home');

        if (Platform.OS === 'android') {
          ToastAndroid.show('Login successful', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Login successful');
        }
      }
    } catch (error) {
      console.error('Login failed', error);
      Alert.alert('Login failed', 'Please check your credentials and try again');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <View style={{ ...backgroundStyle, ...styles.screen }}>
      <View style={styles.header}>
        <Heading level={1}>
          <Text>{t('Login')}</Text>
        </Heading>
      </View>

      <View style={styles.formContainer}>
        <Input
          icon="mail"
          placeholder={t('Email')}
          textContentType="emailAddress"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          style={[
            styles.input,
            {
              borderColor: emailFocused ? XColors.accent : '#ccc',
              backgroundColor: '#f2f2f2', // gris clair
            },
          ]}
        />

        <View style={{ height: 20 }} />

        <PasswordInput
          icon="lock1"
          placeholder={t('Password')}
          value={password}
          onChangeText={setPassword}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          style={[
            styles.input,
            {
              borderColor: passwordFocused ? XColors.accent : '#ccc',
              backgroundColor: '#f2f2f2', // gris clair
              width: '100%',
            },
          ]}
        />

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotText}>{t('Forgot Password?')}</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        <TouchableOpacity onPress={handleLogin} style={styles.loginButton} activeOpacity={0.7}>
          <Text style={styles.loginText}>{t('LOGIN')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center' },
  header: { justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
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
  input: {
    height: 50,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 12 : 0,
    borderWidth: 1,
    borderRadius: 8,
  },
  forgotText: {
    color: XColors.accent,
    marginLeft: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  loginButton: {
    backgroundColor: XColors.accent,
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: { color: 'white', fontWeight: 'bold' },
});

export default LoginScreen;
