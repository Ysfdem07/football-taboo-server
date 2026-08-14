import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GameScreen from '../screens/GameScreen';
import ResultScreen from '../screens/ResultScreen';
import OnlineLobbyScreen from '../screens/OnlineLobbyScreen';
import OnlineGameScreen from '../screens/OnlineGameScreen';
import AboutScreen from '../screens/AboutScreen';
import HowToPlayScreen from '../screens/HowToPlayScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import TournamentScreen from '../screens/TournamentScreen';
import CategoryMenuScreen from '../screens/CategoryMenuScreen';
import TournamentGameScreen from '../screens/TournamentGameScreen';
import CardAlbumScreen from '../screens/CardAlbumScreen';
import PitchBattleScreen from '../screens/PitchBattleScreen';
import MarketScreen from '../screens/MarketScreen';

export type RootStackParamList = {
  Home: undefined;
  Settings: { categoryId?: string };
  Game: { timeLimit: number; winScore: number; teamA: string; teamB: string };
  Result: { teamAScore: number; teamBScore: number; teamA: string; teamB: string };
  OnlineLobby: { categoryId?: string };
  RoomLobby: { roomId: string, roomCode: string, isHost: boolean, categoryId?: string };
  OnlineGame: { roomId: string, categoryId?: string };
  About: undefined;
  HowToPlay: undefined;
  Profile: undefined;
  Leaderboard: { categoryId?: string };
  Tournament: { categoryId?: string };
  CategoryMenu: { categoryId: string };
  TournamentGame: { cards: { word: string; forbidden: string[] }[]; categoryId?: string };
  CardAlbum: { categoryId?: string };
  PitchBattle: undefined;
  Market: undefined;
};

import RoomLobbyScreen from '../screens/RoomLobbyScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShown: false, // Hide header by default for a custom game look
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CategoryMenu" component={CategoryMenuScreen} />
        <Stack.Screen name="Market" component={MarketScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
        <Stack.Screen name="OnlineLobby" component={OnlineLobbyScreen} />
        <Stack.Screen name="RoomLobby" component={RoomLobbyScreen} />
        <Stack.Screen name="OnlineGame" component={OnlineGameScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="Tournament" component={TournamentScreen} />
        <Stack.Screen name="TournamentGame" component={TournamentGameScreen} />
        <Stack.Screen name="CardAlbum" component={CardAlbumScreen} />
        <Stack.Screen name="PitchBattle" component={PitchBattleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
