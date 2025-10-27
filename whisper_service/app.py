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
from functools import wraps
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native requests

# Configuration from environment variables
API_KEY = os.getenv('WHISPER_API_KEY', 'dev-key-change-in-production')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE_MB', '25')) * 1024 * 1024  # 25MB default

# Audit log for HIPAA compliance
def audit_log(event_type, details):
    """Log events for HIPAA audit trail"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "details": details,
        "request_id": getattr(request, 'request_id', 'unknown')
    }
    logger.info(f"AUDIT: {log_entry}")

# Authentication decorator
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip auth in development mode
        if ENVIRONMENT == 'development':
            return f(*args, **kwargs)
        
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            audit_log('AUTH_FAILED', 'Missing authorization header')
            return jsonify({
                "success": False,
                "error": "Authorization required"
            }), 401
        
        # Expected format: "Bearer <API_KEY>"
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != 'bearer' or token != API_KEY:
                audit_log('AUTH_FAILED', 'Invalid API key')
                return jsonify({
                    "success": False,
                    "error": "Invalid authorization"
                }), 401
        except ValueError:
            audit_log('AUTH_FAILED', 'Malformed authorization header')
            return jsonify({
                "success": False,
                "error": "Invalid authorization format"
            }), 401
        
        return f(*args, **kwargs)
    return decorated_function

# Request ID middleware for tracking
@app.before_request
def before_request():
    request.request_id = str(uuid.uuid4())

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
@require_api_key
def transcribe():
    """Transcribe audio file endpoint"""
    audit_log('TRANSCRIPTION_STARTED', 'Audio transcription request received')
    
    try:
        # Check file size
        if request.content_length and request.content_length > MAX_FILE_SIZE:
            audit_log('TRANSCRIPTION_FAILED', f'File too large: {request.content_length} bytes')
            return jsonify({
                "success": False,
                "error": f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024)}MB"
            }), 413
        
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
            
            # Clean up temporary file (HIPAA: delete PHI immediately after processing)
            os.unlink(temp_path)
            
            if result.get('success'):
                audit_log('TRANSCRIPTION_SUCCESS', f'Transcription completed, text length: {len(result.get("text", ""))}')
            else:
                audit_log('TRANSCRIPTION_FAILED', f'Transcription failed: {result.get("error", "Unknown error")}')
            
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
@require_api_key
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
    logger.info(f"Environment: {ENVIRONMENT}")
    logger.info(f"Using device: {whisper_service.device}")
    logger.info(f"Model: {whisper_service.model_id}")
    logger.info(f"Max file size: {MAX_FILE_SIZE / (1024*1024)}MB")
    
    if ENVIRONMENT == 'development':
        logger.warning("Running in DEVELOPMENT mode - API authentication disabled")
    
    # Get port from environment (Azure sets PORT)
    port = int(os.getenv('PORT', 5000))
    
    # Run on all interfaces
    app.run(host='0.0.0.0', port=port, debug=False)
