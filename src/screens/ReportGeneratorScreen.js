import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import WhisperSpeechRecorder from '../components/WhisperSpeechRecorder';

export default function ReportGeneratorScreen({ navigation }) {
  const [reportText, setReportText] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [currentAudioUri, setCurrentAudioUri] = useState(null);

  useEffect(() => {
    loadSavedReports();
    generateDefaultTitle();
  }, []);

  // Generate default report title with timestamp
  const generateDefaultTitle = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setReportTitle(`Field Report - ${dateStr} ${timeStr}`);
  };

  // Load saved reports from local storage
  const loadSavedReports = async () => {
    try {
      const reportsDir = `${FileSystem.documentDirectory}reports/`;
      const dirInfo = await FileSystem.getInfoAsync(reportsDir);
      
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(reportsDir);
        const reports = [];
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const content = await FileSystem.readAsStringAsync(`${reportsDir}${file}`);
            reports.push(JSON.parse(content));
          }
        }
        
        setSavedReports(reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  // Handle recording completion
  const handleRecordingComplete = (audioUri, duration) => {
    setCurrentAudioUri(audioUri);
    console.log(`Recording completed: ${duration} seconds`);
  };

  // Handle Whisper transcription completion
  const handleWhisperTranscriptionComplete = (result) => {
    setReportText(result.text);
    setCurrentAudioUri(result.audioUri);
    setIsEditing(true);
    
    const method = result.method === 'whisper' ? 'AI Whisper' : 'Mock';
    Alert.alert(
      'Transcription Complete',
      `Your voice recording has been converted to text using ${method}. You can now edit the report.`,
      [{ text: 'OK' }]
    );
    
    // Log additional data for debugging
    console.log('Transcription result:', {
      method: result.method,
      duration: result.duration,
      sections: result.sections,
      timestamp: result.timestamp
    });
  };

  // Save report to local storage
  const saveReport = async () => {
    if (!reportTitle.trim() || !reportText.trim()) {
      Alert.alert('Error', 'Please provide both a title and content for the report.');
      return;
    }

    try {
      const reportsDir = `${FileSystem.documentDirectory}reports/`;
      const dirInfo = await FileSystem.getInfoAsync(reportsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(reportsDir, { intermediates: true });
      }

      const report = {
        id: Date.now().toString(),
        title: reportTitle,
        content: reportText,
        timestamp: new Date().toISOString(),
        audioUri: currentAudioUri,
      };

      const filename = `report_${report.id}.json`;
      await FileSystem.writeAsStringAsync(
        `${reportsDir}${filename}`,
        JSON.stringify(report, null, 2)
      );

      Alert.alert(
        'Report Saved',
        'Your field report has been saved successfully.',
        [
          {
            text: 'New Report',
            onPress: () => {
              setReportText('');
              setReportTitle('');
              setCurrentAudioUri(null);
              setIsEditing(false);
              generateDefaultTitle();
            }
          },
          { text: 'Continue Editing' }
        ]
      );

      loadSavedReports();
    } catch (error) {
      console.error('Error saving report:', error);
      Alert.alert('Error', 'Failed to save report. Please try again.');
    }
  };

  // Export report as text file
  const exportReport = async () => {
    if (!reportText.trim()) {
      Alert.alert('Error', 'No report content to export.');
      return;
    }

    try {
      const filename = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, `${reportTitle}\n\n${reportText}`);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Export Complete', `Report saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    }
  };

  // Clear current report
  const clearReport = () => {
    Alert.alert(
      'Clear Report',
      'Are you sure you want to clear the current report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setReportText('');
            setReportTitle('');
            setCurrentAudioUri(null);
            setIsEditing(false);
            generateDefaultTitle();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Voice Report Generator</Text>
            <Text style={styles.headerSubtitle}>Document incidents with voice</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Report Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Report Title</Text>
            <TextInput
              style={styles.titleInput}
              value={reportTitle}
              onChangeText={setReportTitle}
              placeholder="Enter report title..."
              placeholderTextColor="#999"
            />
          </View>

          {/* Voice Recorder */}
          {!isEditing && (
            <View style={styles.recorderSection}>
              <Text style={styles.sectionTitle}>Record Your Report</Text>
              <WhisperSpeechRecorder
                onTranscriptionComplete={handleWhisperTranscriptionComplete}
                style={styles.whisperRecorder}
              />
            </View>
          )}

          {/* Report Text Editor */}
          {(isEditing || reportText) && (
            <View style={styles.editorSection}>
              <View style={styles.editorHeader}>
                <Text style={styles.sectionTitle}>Report Content</Text>
                {!isEditing && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons name="create-outline" size={20} color="#007AFF" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TextInput
                style={styles.reportInput}
                value={reportText}
                onChangeText={setReportText}
                placeholder="Your transcribed report will appear here, or you can type directly..."
                placeholderTextColor="#999"
                multiline
                editable={isEditing}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Action Buttons */}
          {reportText && (
            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.actionButton} onPress={saveReport}>
                <LinearGradient
                  colors={['#4ecdc4', '#44a08d']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="save-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Save Report</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={exportReport}>
                <LinearGradient
                  colors={['#45b7d1', '#96c93d']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="share-outline" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Export</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.clearButton} onPress={clearReport}>
                <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>How to Use</Text>
            <Text style={styles.instructionsText}>
              1. Ensure Whisper service is running (green status indicator){'\n'}
              2. Tap the microphone to start recording your field report{'\n'}
              3. Speak clearly about the incident, patient status, and actions taken{'\n'}
              4. Stop recording - AI will transcribe automatically (or use mock if unavailable){'\n'}
              5. Edit the transcribed text as needed{'\n'}
              6. Save or export your professional EMS report
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recorderSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  editorSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  reportInput: {
    minHeight: 200,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlignVertical: 'top',
  },
  actionsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    minWidth: 100,
  },
  clearButtonText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  whisperRecorder: {
    backgroundColor: 'transparent',
    margin: 0,
    padding: 0,
  },
});
