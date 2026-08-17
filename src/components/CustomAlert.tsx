import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type AlertType = 'success' | 'error' | 'info';

export interface AlertButton {
  text: string;
  style?: 'cancel' | 'default' | 'destructive';
  onPress?: () => void;
}

let showCustomAlert = (title: string, message: string, buttons?: AlertButton[], type?: AlertType) => {};

export const CustomAlert = () => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<{title: string, message: string, buttons?: AlertButton[], type: AlertType}>({ title: '', message: '', type: 'info' });
  const [scale] = useState(new Animated.Value(0.8));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    showCustomAlert = (title, message, buttons, type = 'info') => {
      setConfig({ title, message, buttons, type });
      setVisible(true);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true })
      ]).start();
    };
  }, []);

  const close = (onPress?: () => void) => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setVisible(false);
      if (onPress) onPress();
    });
  };

  if (!visible) return null;

  const iconName = config.type === 'success' ? 'checkmark-circle' : config.type === 'error' ? 'alert-circle' : 'information-circle';
  const iconColor = config.type === 'success' ? '#00FF88' : config.type === 'error' ? '#FF3366' : '#38BDF8';
  
  const buttons = config.buttons && config.buttons.length > 0 
    ? config.buttons 
    : [{ text: 'OK', onPress: () => {} }];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={() => close(buttons.find(b => b.style === 'cancel')?.onPress)}>
      <View style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.alertBox, { opacity, transform: [{ scale }], shadowColor: iconColor }]}>
          
          {/* Header Graphic */}
          <View style={[styles.headerGraphic, { backgroundColor: iconColor }]} />
          
          <View style={styles.iconContainer}>
             <Ionicons name={iconName} size={54} color={iconColor} />
          </View>
          
          <Text style={styles.title}>{config.title}</Text>
          {config.message ? <Text style={styles.message}>{config.message}</Text> : null}
          
          <View style={styles.buttonRow}>
            {buttons.map((btn, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[
                  styles.button, 
                  btn.style === 'cancel' ? styles.cancelButton : { backgroundColor: iconColor },
                  buttons.length === 2 && styles.halfButton
                ]} 
                onPress={() => close(btn.onPress)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.buttonText, 
                  btn.style === 'cancel' && { color: '#FFF' },
                  btn.style !== 'cancel' && { color: '#000' }
                ]}>
                  {btn.text.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

CustomAlert.show = (title: string, message?: string, buttons?: AlertButton[], type: AlertType = 'info') => {
  let inferredType = type;
  if (type === 'info') {
    const t = title.toLowerCase();
    if (t.includes('başarılı') || t.includes('tebrik') || t.includes('success') || t.includes('kazanc') || t.includes('satın')) inferredType = 'success';
    if (t.includes('hata') || t.includes('uyarı') || t.includes('yetersiz') || t.includes('error') || t.includes('dolu') || t.includes('gerekli')) inferredType = 'error';
  }
  showCustomAlert(title, message || '', buttons, inferredType);
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 5, 15, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  headerGraphic: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  iconContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 50,
    padding: 8,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  halfButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  }
});
