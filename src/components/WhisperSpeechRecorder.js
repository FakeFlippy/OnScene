/**
 * OnScene EMS - Whisper Speech Recorder Component
 * Advanced speech recording with local Whisper transcription
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import WhisperService from '../services/whisperService';

const WhisperSpeechRecorder = ({ onTranscriptionComplete, style }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [whisperStatus, setWhisperStatus] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  
  const durationInterval = useRef(null);

  useEffect(() => {
    checkWhisperService();
    setupAudio();
    
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const checkWhisperService = async () => {
    try {
      const status = await WhisperService.getServiceStatus();
      setWhisperStatus(status);
    } catch (error) {
      console.log('Whisper service check failed:', error);
      setWhisperStatus(null);
    }
  };

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Audio setup failed:', error);
      Alert.alert('Error', 'Failed to setup audio permissions');
    }
  };

  const startRecording = async () => {
    try {
      if (!whisperStatus) {
        Alert.alert(
          'Whisper Service Unavailable',
          'The speech recognition service is not running. Please start the Python backend service.',
          [
            { text: 'Continue with Mock', onPress: () => startRecordingAnyway() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      await startRecordingAnyway();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const startRecordingAnyway = async () => {
    try {
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
      setTranscription('');

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Recording start error:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      clearInterval(durationInterval.current);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);

      // Start transcription process
      if (whisperStatus && uri) {
        await transcribeWithWhisper(uri);
      } else {
        // Fallback to mock transcription
        await mockTranscription();
      }

    } catch (error) {
      console.error('Recording stop error:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const transcribeWithWhisper = async (audioUri) => {
    setIsProcessing(true);
    
    try {
      console.log('Starting Whisper transcription...');
      const result = await WhisperService.transcribeForEMSReport(audioUri);
      
      setTranscription(result.formattedText);
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete({
          text: result.formattedText,
          rawText: result.rawTranscription,
          duration: result.duration,
          sections: result.sections,
          audioUri: audioUri,
          timestamp: result.timestamp,
          method: 'whisper'
        });
      }

    } catch (error) {
      console.error('Whisper transcription failed:', error);
      Alert.alert(
        'Transcription Failed', 
        'Speech recognition failed. Using mock transcription.',
        [{ text: 'OK', onPress: () => mockTranscription() }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const mockTranscription = async () => {
    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      const mockText = `EMS Report - ${new Date().toLocaleTimeString()}\n\nPatient assessment completed. Vital signs stable. Treatment administered as per protocol. Transport to facility initiated.`;
      
      setTranscription(mockText);
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete({
          text: mockText,
          rawText: mockText,
          duration: recordingDuration,
          sections: { narrative: mockText },
          audioUri: audioUri,
          timestamp: new Date().toISOString(),
          method: 'mock'
        });
      }
      
      setIsProcessing(false);
    }, 2000);
  };

  const retryTranscription = async () => {
    if (audioUri && whisperStatus) {
      await transcribeWithWhisper(audioUri);
    } else {
      Alert.alert('Error', 'No audio file available or Whisper service unavailable');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (isRecording) return '#ff4444';
    if (isProcessing) return '#ff9500';
    if (whisperStatus) return '#4CAF50';
    return '#757575';
  };

  const getStatusText = () => {
    if (isRecording) return 'Recording...';
    if (isProcessing) return 'Processing...';
    if (whisperStatus) return 'Whisper Ready';
    return 'Whisper Unavailable';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
        {whisperStatus && (
          <Text style={styles.modelText}>
            {whisperStatus.model?.replace('openai/', '')}
          </Text>
        )}
      </View>

      {/* Recording Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingButton]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={isRecording ? ['#ff4444', '#cc0000'] : ['#667eea', '#764ba2']}
            style={styles.buttonGradient}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={32}
              color="white"
            />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.actionText}>
            {isRecording ? 'Tap to Stop Recording' : 'Tap to Start Recording'}
          </Text>
          
          {isRecording && (
            <Text style={styles.durationText}>
              Duration: {formatDuration(recordingDuration)}
            </Text>
          )}

          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#667eea" />
              <Text style={styles.processingText}>
                {whisperStatus ? 'Transcribing with Whisper...' : 'Processing...'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Transcription Result */}
      {transcription && (
        <View style={styles.transcriptionContainer}>
          <View style={styles.transcriptionHeader}>
            <Text style={styles.transcriptionTitle}>Transcription Result</Text>
            {audioUri && whisperStatus && (
              <TouchableOpacity onPress={retryTranscription} style={styles.retryButton}>
                <Ionicons name="refresh" size={20} color="#667eea" />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.transcriptionScroll}>
            <Text style={styles.transcriptionText}>{transcription}</Text>
          </ScrollView>
        </View>
      )}

      {/* Service Status */}
      {!whisperStatus && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={20} color="#ff9500" />
          <Text style={styles.warningText}>
            Whisper service unavailable. Start Python backend for AI transcription.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 10,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  modelText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordingButton: {
    transform: [{ scale: 1.1 }],
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  durationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    fontFamily: 'monospace',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  transcriptionContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    maxHeight: 200,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transcriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  retryButton: {
    padding: 5,
  },
  transcriptionScroll: {
    maxHeight: 150,
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#856404',
    flex: 1,
  },
});

export default WhisperSpeechRecorder;
