import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function VoiceRecorder({ onRecordingComplete, onTranscriptionComplete }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationInterval = useRef(null);

  // Request audio permissions
  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Audio recording permission is required to create voice reports.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Configure recording options
      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      clearInterval(durationInterval.current);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (onRecordingComplete) {
        onRecordingComplete(uri, recordingDuration);
      }

      // Process the recording for transcription
      await processRecording(uri);

      setRecording(null);
      setRecordingDuration(0);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  // Process recording for transcription (placeholder for Whisper integration)
  const processRecording = async (audioUri) => {
    setIsProcessing(true);
    
    try {
      // For now, we'll simulate transcription processing
      // In a real implementation, you would:
      // 1. Send the audio file to a local Whisper service
      // 2. Or use a cloud-based transcription service
      // 3. Return the transcribed text
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock transcription result
      const mockTranscription = `Field Report - ${new Date().toLocaleString()}\n\nPatient assessment completed. Vital signs stable. Transport initiated to nearest medical facility. No complications observed during transport.`;
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(mockTranscription, audioUri);
      }
      
    } catch (error) {
      console.error('Transcription failed:', error);
      Alert.alert('Error', 'Transcription failed. The audio file has been saved for manual processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel recording
  const cancelRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      setIsRecording(false);
      setRecordingDuration(0);
      clearInterval(durationInterval.current);
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  // Format duration display
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.processingText}>Processing voice recording...</Text>
        <Text style={styles.processingSubtext}>Converting speech to text</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.recordingInfo}>
          <View style={styles.recordingIndicator}>
            <View style={styles.pulsingDot} />
            <Text style={styles.recordingText}>Recording</Text>
          </View>
          <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
        </View>
      )}

      <View style={styles.controlsContainer}>
        {!isRecording ? (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startRecording}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ee5a52']}
              style={styles.recordButtonGradient}
            >
              <Ionicons name="mic" size={32} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelRecording}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="#ff6b6b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4ecdc4', '#44a08d']}
                style={styles.stopButtonGradient}
              >
                <Ionicons name="stop" size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.instructionText}>
        {!isRecording 
          ? 'Tap to start recording your field report'
          : 'Speak clearly to document the incident'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  recordingInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff6b6b',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  durationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  controlsContainer: {
    marginBottom: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  recordButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  cancelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  stopButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 4,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666',
  },
});
