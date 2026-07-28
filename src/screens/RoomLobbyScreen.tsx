import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ImageBackground, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { getSocket } from '../services/socket';
import { BannerAdComponent } from '../services/ads';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RoomLobby'>;
  route: RouteProp<RootStackParamList, 'RoomLobby'>;
};

export default function RoomLobbyScreen({ navigation, route }: Props) {
  const { roomId, roomCode, isHost } = route.params;
  const [players, setPlayers] = useState<any[]>([]);
  const [currentHostId, setCurrentHostId] = useState<string | null>(null);
  const socket = getSocket();

  useEffect(() => {
    socket.on('room_update', (data: any) => {
      setPlayers(data.players);
      setCurrentHostId(data.hostId);
    });

    socket.on('game_starting_soon', () => {
      // Small delay before transition to make UI feel smooth
      setTimeout(() => {
        navigation.replace('OnlineGame', { roomId });
      }, 1000);
    });

    return () => {
      socket.off('room_update');
      socket.off('game_starting_soon');
    };
  }, []);

  const startGame = () => {
    if (players.length < 2) {
      Alert.alert('Uyarı', 'Oyunu başlatmak için en az 2 kişi olmalı!');
      return;
    }
    socket.emit('start_room_game', { roomId });
  };

  const leaveRoom = () => {
    socket.disconnect(); // This triggers disconnect on server and cleans up
    navigation.goBack();
  };

  const isCurrentHost = currentHostId === socket.id;

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>ÖZEL ODA</Text>
        
        <View style={styles.mainWrapper}>
          <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>ODA KODU</Text>
          <Text style={styles.codeText}>{roomCode}</Text>
        </View>

        <View style={styles.playersContainer}>
          <Text style={styles.playersTitle}>Oyuncular ({players.length})</Text>
          <FlatList
            data={players}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.playerRow}>
                <Text style={styles.playerName}>
                  {item.id === socket.id ? item.name + " (Sen)" : item.name}
                  {item.id === currentHostId ? " 👑" : ""}
                </Text>
              </View>
            )}
          />
        </View>

        <View style={styles.actionContainer}>
          {isCurrentHost ? (
            <TouchableOpacity 
              style={[styles.button, players.length < 2 && styles.buttonDisabled]} 
              onPress={startGame}
              disabled={players.length < 2}
            >
              <Text style={styles.buttonText}>OYUNU BAŞLAT</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>Kurucunun oyunu başlatması bekleniyor...</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.button, styles.leaveButton]} onPress={leaveRoom}>
            <Text style={styles.buttonText}>Odadan Ayrıl</Text>
          </TouchableOpacity>
        </View>
        </View>
        <BannerAdComponent />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 8, 20, 0.88)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  mainWrapper: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontFamily: 'Poppins_900Black',
    color: '#00FF88',
    marginTop: 20,
    marginBottom: 20,
    textShadowColor: 'rgba(0,255,136,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  codeContainer: {
    backgroundColor: 'rgba(0,255,136,0.08)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)',
  },
  codeLabel: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: 5,
  },
  codeText: {
    color: Colors.warning,
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 5,
  },
  playersContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,255,136,0.04)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.18)',
  },
  playersTitle: {
    color: '#00FF88',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,136,0.2)',
    paddingBottom: 10,
  },
  playerRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  playerName: {
    color: Colors.white,
    fontSize: 18,
  },
  actionContainer: {
    width: '100%',
    paddingVertical: 20,
  },
  button: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: '#00FF88',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 12,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(100,100,100,0.3)',
    borderColor: '#555',
    shadowColor: 'transparent',
  },
  leaveButton: {
    backgroundColor: 'rgba(220,53,69,0.2)',
    borderColor: '#DC3545',
    shadowColor: '#DC3545',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  waitingContainer: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  waitingText: {
    color: '#00FF88',
    fontSize: 15,
    textAlign: 'center',
  },
});
