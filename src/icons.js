// src/assets/icons.js
import React from 'react';
import { Image } from 'react-native';

export const TabIcons = {
  Home: ({ focused }) => (
    <Image
      source={require('./assets/icons/home.png')}
      style={{ width: 24, height: 24, tintColor: focused ? 'black' : 'gray' }}
    />
  ),
  Chats: ({ focused }) => (
    <Image
      source={require('./assets/icons/chat.png')}
      style={{ width: 24, height: 24, tintColor: focused ? 'black' : 'gray' }}
    />
  ),
  Post: ({ focused }) => (
    <Image
      source={require('./assets/icons/post.png')}
      style={{ width: 24, height: 24, tintColor: focused ? 'black' : 'gray' }}
    />
  ),
  Profile: ({ focused }) => (
    <Image
      source={require('./assets/icons/profile.png')}
      style={{ width: 24, height: 24, tintColor: focused ? 'black' : 'gray' }}
    />
  ),
  Score: ({ focused }) => (
    <Image
      source={require('./assets/icons/score.png')}
      style={{ width: 24, height: 24, tintColor: focused ? 'black' : 'gray' }}
    />
  ),
};
