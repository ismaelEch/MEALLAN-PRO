import 'intl-pluralrules';
import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
const Colors = {
  lighter: '#f6f6f6',
  light: '#ffffff',
  dark: '#000000',
  darker: '#111111',
};
import { StyleSheet } from 'react-native';
import HomeScreen from './src/screens/home.screen';
import LoginScreen from './src/screens/login.screen';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './src/screens/splash.screen';
import i18n from './src/utils/i18n';
import { I18nextProvider } from 'react-i18next';
import ForgotPasswordScreen from './src/screens/forgotpass.screen';


const backgroundStyle = {
  backgroundColor: Colors.lighter,
};

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = React.useState('Home');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setInitialRoute('Home');
      }
    };
    checkToken();
  }, []);

  React.useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaView style={{ ...backgroundStyle, ...styles.app }}>
      <I18nextProvider i18n={i18n}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name={'Login'}
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name={'ForgotPassword'}
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name={'Home'} component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </I18nextProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: { display: 'flex', flex: 1 },
});
