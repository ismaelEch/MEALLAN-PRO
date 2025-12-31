import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  TouchableOpacity,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { XColors } from '../config/constants';
const Colors = {
  lighter: '#f6f6f6',
  light: '#ffffff',
  dark: '#000000',
  darker: '#111111',
};

type InputProps = TextInputProps & {
  icon: string;
};

export const Input = (props: InputProps) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const inputBorderStyles = {
    borderColor: isFocused ? XColors.accent : XColors.lightgrey,
    borderWidth: 0.5,
    color: Colors.dark,
  };

  return (
    <TextInput
      placeholderTextColor={Colors.dark}
      style={{
        ...inputBorderStyles,
        ...styles.search,
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
    />
  );
};

export const PasswordInput = (props: InputProps) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const inputBorderStyles = {
    borderColor: isFocused ? XColors.accent : XColors.lightgrey,
    borderWidth: 0.5,
    color: Colors.dark,
  };

  return (
    <View style={styles.searchContainer}>
      <TextInput
        placeholderTextColor={Colors.dark}
        style={{
          ...inputBorderStyles,
          ...styles.search,
        }}
        {...props}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={!isPasswordVisible}
      />
      <TouchableOpacity
        style={styles.rightIconButton}
        onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
        <AntDesign
          name={isPasswordVisible ? 'eye' : 'eyeo'}
          size={20}
          color={Colors.dark}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  search: {
    backgroundColor: XColors.lightgrey,
    borderRadius: 5,
    width: '100%',
    paddingLeft: 16,
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
  },
  serachIcon: {
    position: 'absolute',
    left: 15,
    top: 15,
    color: Colors.dark,
  },
  rightIconButton: { top: 15, right: 15, position: 'absolute' },
});
