import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';

// Lets code outside the navigator (a push-notification tap handler in
// App.tsx, the duel-invite listener) navigate without the ref being passed
// down through props. Lives in its own file so components that AppNavigator
// itself renders can import it without an import cycle.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
