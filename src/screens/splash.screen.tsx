import React, {useEffect} from 'react';
import {StyleSheet, Text, Image, StatusBar, Animated} from 'react-native';

const SplashScreen = () => {
  const logoAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, {opacity: logoAnim}]}>
      <StatusBar backgroundColor="#4dc6e2" />
      <Image
        source={require('../../assets/logo-tranparent.png')}
        style={styles.logo}
      />
      <Text style={styles.logoText}>MEALLAN</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4dc6e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  logoText: {
    marginTop: 10,
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default SplashScreen;
