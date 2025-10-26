"""
OnScene EMS - Whisper Speech Recognition Service
Local Python backend for HIPAA-compliant speech-to-text processing
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
import os
import tempfile
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native requests

class WhisperService:
    def __init__(self):
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        self.model_id = "openai/whisper-base"  # Smaller model for limited memory
        self.pipe = None
        self.load_model()
    
    def load_model(self):
        """Load Whisper model and create pipeline"""
        try:
            logger.info(f"Loading Whisper model on {self.device}")
            
            model = AutoModelForSpeechSeq2Seq.from_pretrained(
                self.model_id, 
                torch_dtype=self.dtype, 
                low_cpu_mem_usage=True, 
                use_safetensors=True
            )
            model.to(self.device)
            
            processor = AutoProcessor.from_pretrained(self.model_id)
            
            self.pipe = pipeline(
                "automatic-speech-recognition",
                model=model,
                tokenizer=processor.tokenizer,
                feature_extractor=processor.feature_extractor,
                torch_dtype=self.dtype,
                device=self.device,
                chunk_length_s=30,  # For long audio files
                batch_size=16 if self.device.startswith("cuda") else 1
            )
            
            logger.info("Whisper model loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def transcribe_audio(self, audio_path, language="english", return_timestamps=True):
        """Transcribe audio file to text"""
        try:
            # EMS-optimized generation parameters
            generate_kwargs = {
                "language": language,
                "task": "transcribe",
                "temperature": (0.0, 0.2, 0.4, 0.6, 0.8, 1.0),  # Temperature fallback
                "compression_ratio_threshold": 1.35,
                "logprob_threshold": -1.0,
                "no_speech_threshold": 0.6,
                "condition_on_prev_tokens": False,
                "return_timestamps": return_timestamps
            }
            
            result = self.pipe(audio_path, generate_kwargs=generate_kwargs)
            
            return {
                "success": True,
                "text": result["text"],
                "chunks": result.get("chunks", []) if return_timestamps else [],
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Transcription error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

# Initialize Whisper service
whisper_service = WhisperService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "OnScene EMS Whisper Service",
        "model": whisper_service.model_id,
        "device": whisper_service.device,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio file endpoint"""
    try:
        # Check if audio file is provided
        if 'audio' not in request.files:
            return jsonify({
                "success": False,
                "error": "No audio file provided"
            }), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({
                "success": False,
                "error": "No audio file selected"
            }), 400
        
        # Get optional parameters
        language = request.form.get('language', 'english')
        return_timestamps = request.form.get('timestamps', 'true').lower() == 'true'
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            audio_file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Transcribe audio
            result = whisper_service.transcribe_audio(
                temp_path, 
                language=language, 
                return_timestamps=return_timestamps
            )
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            return jsonify(result)
            
        except Exception as e:
            # Clean up temporary file on error
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e
            
    except Exception as e:
        logger.error(f"Transcription endpoint error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/transcribe-text', methods=['POST'])
def transcribe_text_only():
    """Quick transcribe endpoint that returns only text"""
    try:
        result = transcribe()
        if isinstance(result, tuple):  # Error response
            return result
        
        response_data = result.get_json()
        if response_data.get("success"):
            return jsonify({
                "text": response_data.get("text", ""),
                "success": True
            })
        else:
            return result
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting OnScene EMS Whisper Service...")
    logger.info(f"Using device: {whisper_service.device}")
    logger.info(f"Model: {whisper_service.model_id}")
    
    # Run on all interfaces to allow mobile device connections
    # Still secure as it's limited to your local network
    app.run(host='0.0.0.0', port=5000, debug=False)
