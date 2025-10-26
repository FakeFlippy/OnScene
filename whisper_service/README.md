# OnScene EMS - Whisper Speech Recognition Service

Local Python backend service for HIPAA-compliant speech-to-text processing using OpenAI's Whisper large-v3-turbo model.

## Features

- **Local Processing**: Runs entirely on your machine for HIPAA compliance
- **High Accuracy**: Uses Whisper large-v3-turbo for state-of-the-art speech recognition
- **EMS Optimized**: Configured for medical terminology and noisy environments
- **Chunked Processing**: Handles long audio recordings efficiently
- **GPU Acceleration**: Automatic CUDA detection for faster processing
- **RESTful API**: Easy integration with React Native app

## Installation

1. **Create Python virtual environment**:
   ```bash
   cd whisper_service
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # macOS/Linux
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the service**:
   ```bash
   python app.py
   ```

The service will start on `http://127.0.0.1:5000`

## API Endpoints

### Health Check
```
GET /health
```
Returns service status and model information.

### Transcribe Audio
```
POST /transcribe
Content-Type: multipart/form-data

Parameters:
- audio: Audio file (WAV, MP3, M4A, etc.)
- language: Language code (default: "english")
- timestamps: Return timestamps (default: "true")
```

### Quick Text Transcription
```
POST /transcribe-text
Content-Type: multipart/form-data

Parameters:
- audio: Audio file
- language: Language code (default: "english")
```

## React Native Integration

Add this service integration to your EMSApp:

```javascript
// services/whisperService.js
const WHISPER_BASE_URL = 'http://127.0.0.1:5000';

export const transcribeAudio = async (audioUri, language = 'english') => {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    type: 'audio/wav',
    name: 'recording.wav',
  });
  formData.append('language', language);

  const response = await fetch(`${WHISPER_BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return await response.json();
};
```

## Performance Optimizations

The service includes several optimizations from the Hugging Face documentation:

- **Chunked Processing**: 30-second chunks for long audio
- **Temperature Fallback**: Multiple temperature attempts for better accuracy
- **GPU Acceleration**: Automatic CUDA detection
- **Batch Processing**: Configurable batch size based on device
- **Memory Optimization**: Low CPU memory usage settings

## Security & HIPAA Compliance

- **Local Only**: Runs on localhost (127.0.0.1) only
- **No Cloud Dependencies**: All processing happens on your machine
- **Temporary Files**: Audio files are automatically cleaned up
- **No Data Persistence**: No audio or transcription data is stored

## System Requirements

- **Python**: 3.8 or higher
- **RAM**: 8GB minimum, 16GB recommended
- **GPU**: NVIDIA GPU with CUDA support (optional but recommended)
- **Storage**: 3GB for model files

## Troubleshooting

### Model Download Issues
The first run will download the Whisper model (~800MB). Ensure you have a stable internet connection.

### GPU Issues
If CUDA is not available, the service will automatically fall back to CPU processing.

### Memory Issues
Reduce batch_size in the pipeline configuration if you encounter out-of-memory errors.
