/**
 * OnScene EMS - Whisper Service Integration
 * Connects React Native app to Whisper backend (local or Azure cloud)
 */

import { WHISPER_BASE_URL, WHISPER_API_KEY, WHISPER_TIMEOUT } from '../config/whisper.config';

class WhisperService {
  constructor() {
    this.isServiceAvailable = false;
    this.checkServiceHealth();
  }

  /**
   * Check if Whisper service is running and healthy
   */
  async checkServiceHealth() {
    try {
      const headers = {};
      if (WHISPER_API_KEY) {
        headers['Authorization'] = `Bearer ${WHISPER_API_KEY}`;
      }
      
      const response = await fetch(`${WHISPER_BASE_URL}/health`, {
        method: 'GET',
        headers,
        timeout: 5000,
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isServiceAvailable = data.status === 'healthy';
        console.log('Whisper service status:', data);
        return data;
      } else {
        this.isServiceAvailable = false;
        return null;
      }
    } catch (error) {
      console.log('Whisper service not available:', error.message);
      this.isServiceAvailable = false;
      return null;
    }
  }

  /**
   * Transcribe audio file to text with timestamps
   * @param {string} audioUri - Local file URI of the audio recording
   * @param {string} language - Language code (default: 'english')
   * @param {boolean} includeTimestamps - Whether to include timestamps
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(audioUri, language = 'english', includeTimestamps = true) {
    try {
      // Check service availability first
      if (!this.isServiceAvailable) {
        await this.checkServiceHealth();
        if (!this.isServiceAvailable) {
          throw new Error('Whisper service is not available. Please start the Python backend.');
        }
      }

      const formData = new FormData();
      
      // Prepare audio file for upload
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'ems_recording.wav',
      });
      
      formData.append('language', language);
      formData.append('timestamps', includeTimestamps.toString());

      console.log('Sending audio to Whisper service...');
      
      const headers = {
        'Content-Type': 'multipart/form-data',
      };
      
      // Add authentication for production
      if (WHISPER_API_KEY) {
        headers['Authorization'] = `Bearer ${WHISPER_API_KEY}`;
      }
      
      const response = await fetch(`${WHISPER_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
        headers,
        timeout: WHISPER_TIMEOUT,
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Transcription successful:', result.text.substring(0, 100) + '...');
        return result;
      } else {
        throw new Error(result.error || 'Transcription failed');
      }

    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw error;
    }
  }

  /**
   * Quick transcription that returns only text (no timestamps)
   * @param {string} audioUri - Local file URI of the audio recording
   * @param {string} language - Language code (default: 'english')
   * @returns {Promise<string>} Transcribed text
   */
  async transcribeTextOnly(audioUri, language = 'english') {
    try {
      const result = await this.transcribeAudio(audioUri, language, false);
      return result.text;
    } catch (error) {
      console.error('Quick transcription error:', error);
      throw error;
    }
  }

  /**
   * Process transcription for EMS report formatting
   * @param {string} audioUri - Local file URI of the audio recording
   * @returns {Promise<Object>} Formatted EMS report data
   */
  async transcribeForEMSReport(audioUri) {
    try {
      const result = await this.transcribeAudio(audioUri, 'english', true);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Process the transcription for EMS-specific formatting
      const emsReport = this.formatForEMSReport(result);
      
      return emsReport;

    } catch (error) {
      console.error('EMS transcription error:', error);
      throw error;
    }
  }

  /**
   * Format transcription result for EMS report structure
   * @param {Object} transcriptionResult - Raw Whisper transcription result
   * @returns {Object} Formatted EMS report
   */
  formatForEMSReport(transcriptionResult) {
    const { text, chunks, timestamp } = transcriptionResult;
    
    // Basic EMS report structure
    const report = {
      timestamp: timestamp,
      rawTranscription: text,
      formattedText: this.cleanTranscriptionForEMS(text),
      duration: this.calculateDuration(chunks),
      sections: this.extractEMSSections(text),
      confidence: this.calculateConfidence(chunks),
    };

    return report;
  }

  /**
   * Clean transcription text for medical documentation
   * @param {string} text - Raw transcription text
   * @returns {string} Cleaned text
   */
  cleanTranscriptionForEMS(text) {
    // Remove filler words and clean up for medical documentation
    return text
      .replace(/\b(um|uh|like|you know)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  }

  /**
   * Extract common EMS report sections from transcription
   * @param {string} text - Transcription text
   * @returns {Object} Extracted sections
   */
  extractEMSSections(text) {
    const sections = {
      chiefComplaint: '',
      assessment: '',
      treatment: '',
      vitals: '',
      narrative: text, // Default to full text
    };

    // Simple keyword-based section detection
    // This could be enhanced with NLP or custom training
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('chief complaint') || lowerText.includes('presenting')) {
      // Extract chief complaint section
    }
    
    if (lowerText.includes('blood pressure') || lowerText.includes('pulse') || lowerText.includes('vitals')) {
      // Extract vitals section
    }

    return sections;
  }

  /**
   * Calculate recording duration from chunks
   * @param {Array} chunks - Timestamp chunks from Whisper
   * @returns {number} Duration in seconds
   */
  calculateDuration(chunks) {
    if (!chunks || chunks.length === 0) return 0;
    
    const lastChunk = chunks[chunks.length - 1];
    return lastChunk?.timestamp?.[1] || 0;
  }

  /**
   * Calculate average confidence from chunks
   * @param {Array} chunks - Timestamp chunks from Whisper
   * @returns {number} Average confidence score
   */
  calculateConfidence(chunks) {
    // Whisper doesn't provide confidence scores directly
    // This is a placeholder for future enhancement
    return 0.85; // Default confidence
  }

  /**
   * Get service status and model information
   * @returns {Promise<Object>} Service status
   */
  async getServiceStatus() {
    return await this.checkServiceHealth();
  }
}

// Export singleton instance
export default new WhisperService();
