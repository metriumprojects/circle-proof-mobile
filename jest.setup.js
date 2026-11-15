/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-worklets', () => ({}), { virtual: true });

jest.mock('@clerk/clerk-expo', () => {
  return {
    ClerkProvider: ({ children }) => children,
    ClerkLoaded: ({ children }) => children,
    useAuth: () => ({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      getToken: jest.fn(async () => null),
      signOut: jest.fn(async () => {}),
    }),
    useUser: () => ({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    }),
    useSignIn: () => ({
      isLoaded: true,
      signIn: { create: jest.fn() },
      setActive: jest.fn(),
    }),
    useSignUp: () => ({
      isLoaded: true,
      signUp: { create: jest.fn() },
      setActive: jest.fn(),
    }),
    useSSO: () => ({
      startSSOFlow: jest.fn(async () => ({})),
    }),
  };
});

jest.mock('@clerk/clerk-expo/token-cache', () => ({
  tokenCache: {
    getToken: jest.fn(async () => null),
    saveToken: jest.fn(async () => {}),
  },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  warmUpAsync: jest.fn(async () => {}),
  coolDownAsync: jest.fn(async () => {}),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'circleproof://redirect'),
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async () => 'mock-digest'),
}));

jest.mock('react-native-toast-message', () => {
  const Toast = () => null;
  Toast.show = jest.fn();
  Toast.hide = jest.fn();
  return Toast;
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
  launchCamera: jest.fn(async () => ({ didCancel: true })),
}));

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(async () => []),
  types: { allFiles: '*/*', pdf: 'application/pdf', images: 'image/*' },
  isErrorWithCode: jest.fn(() => false),
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-video', () => 'Video');
jest.mock('react-native-pdf', () => 'Pdf');
jest.mock('react-native-blob-util', () => ({
  config: jest.fn(() => ({ fetch: jest.fn(async () => ({ path: () => '' })) })),
  fs: { dirs: { DocumentDir: '/tmp', DownloadDir: '/tmp' } },
}));
jest.mock('react-native-country-codes-picker', () => ({
  CountryPicker: () => null,
}));
jest.mock('react-native-draggable-flatlist', () => {
  const { FlatList } = require('react-native');
  return {
    __esModule: true,
    default: FlatList,
    ScaleDecorator: ({ children }) => children,
  };
});
jest.mock('react-native-reanimated-carousel', () => () => null);
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
  })),
}));
