module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.afterEnv.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|@react-navigation|@clerk|expo(nent)?|@expo(nent)?/.*|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-svg|react-native-vector-icons|react-native-toast-message|react-native-linear-gradient|react-native-draggable-flatlist|react-native-reanimated-carousel|react-native-country-codes-picker)/',
  ],
};
