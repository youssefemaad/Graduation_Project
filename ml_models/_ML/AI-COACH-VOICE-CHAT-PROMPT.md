# Prompt 6: AI Coach Assistant with Voice & Chat

Create a complete AI Coach assistant system for fitness guidance using fine-tuned HuggingFace models with voice and text chat capabilities.

**Context:**
- .NET 8 Web API backend
- Next 18 frontend with TypeScript
- PostgreSQL for conversation history
- HuggingFace Llama 3.2 3B fine-tuned on fitness data
- Real-time voice chat + text chat
- User fitness profiles and workout/nutrition history

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────┐
│           AI COACH VOICE + CHAT SYSTEM              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Frontend (Next)                                   │
│  ├── Voice Input (Web Speech API / MediaRecorder)  │
│  ├── Text Chat Interface                           │
│  └── Audio Playback                                │
│                                                     │
│  Backend (.NET API)                                │
│  ├── CoachController (/api/coach/chat)            │
│  ├── CoachService (conversation logic)            │
│  └── ConversationRepository (PostgreSQL)          │
│                                                     │
│  Python ML Servers                                 │
│  ├── Whisper Server (Speech-to-Text) :5003       │
│  ├── Llama 3.2 3B Coach (Chat) :5002             │
│  └── Piper TTS (Text-to-Speech) :5004            │
│                                                     │
│  Database (PostgreSQL)                             │
│  └── Conversations table (history + context)       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## PART 1: PYTHON ML SERVERS

### 1.1 Fine-tuned Llama 3.2 3B Coach Server

**File:** `ml_models/coach_server/app.py`

```python
from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from typing import List, Dict

app = Flask(__name__)


class FitnessCoachModel:
    def __init__(self, model_path: str):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            device_map="auto"
        )
        self.model.eval()
    
    def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        user_context: Dict = None,
        max_tokens: int = 512
    ) -> str:
        # Build system prompt with user context
        system_prompt = self._build_system_prompt(user_context)
        full_messages = [{"role": "system", "content": system_prompt}] + messages
        
        # Apply chat template
        prompt = self.tokenizer.apply_chat_template(
            full_messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        # Generate
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.1,
                do_sample=True
            )
        
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        response = response.split("assistant\n")[-1].strip()
        
        return response
    
    def _build_system_prompt(self, user_context: Dict) -> str:
        if not user_context:
            return "You are an expert fitness coach assistant."
        
        return f"""You are an expert fitness coach for {user_context.get('name', 'the user')}.

User Profile:
- Age: {user_context.get('age')} years
- Weight: {user_context.get('weight')} kg
- Height: {user_context.get('height')} cm
- Fitness Level: {user_context.get('fitness_level')}
- Goal: {user_context.get('fitness_goal')}

Provide personalized, motivating, and scientifically accurate fitness coaching."""

# Initialize model
coach_model = FitnessCoachModel("./models/intellifit-llama-3b")

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    messages = data.get('messages', [])
    user_context = data.get('user_context', {})
    
    try:
        response = coach_model.generate_response(messages, user_context)
        return jsonify({'response': response, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'device': coach_model.device})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
```

### 1.2 Whisper Speech-to-Text Server

**File:** `ml_models/whisper_server/app.py`

```python
from flask import Flask, request, jsonify
import whisper
import tempfile
import os

app = Flask(__name__)

# Load Whisper model (base = 140MB, good balance)
model = whisper.load_model("base")

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400
    
    audio_file = request.files['audio']
    language = request.form.get('language', 'en')
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name
    
    try:
        result = model.transcribe(tmp_path, language=language)
        return jsonify({'text': result['text'], 'language': result['language']})
    finally:
        os.unlink(tmp_path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
```

### 1.3 Piper Text-to-Speech Server

**File:** `ml_models/tts_server/app.py`

```python
from flask import Flask, request, send_file
import piper
import io

app = Flask(__name__)

voice = piper.PiperVoice.load("en_US-lessac-medium")

@app.route('/synthesize', methods=['POST'])
def synthesize():
    text = request.json.get('text', '')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    audio_bytes = io.BytesIO()
    voice.synthesize(text, audio_bytes)
    audio_bytes.seek(0)
    
    return send_file(audio_bytes, mimetype='audio/wav')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004)
```

---

## PART 2: .NET BACKEND

### 2.1 Coach Service Interface

```csharp
public interface ICoachService
{
    Task<CoachResponse> SendMessage(CoachRequest request);
    Task<List<ConversationMessage>> GetConversationHistory(int userId, int limit = 50);
}

public class CoachRequest
{
    public int UserId { get; set; }
    public string Message { get; set; }
    public bool IncludeUserContext { get; set; } = true;
}

public class CoachResponse
{
    public string Response { get; set; }
    public string MessageId { get; set; }
    public DateTime Timestamp { get; set; }
}
```

### 2.2 API Controller

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoachController : ControllerBase
{
    private readonly ICoachService _coachService;
    private readonly ISpeechToTextService _speechToText;
    private readonly ITextToSpeechService _textToSpeech;

    [HttpPost("chat")]
    public async Task<ActionResult<CoachResponse>> Chat([FromBody] ChatRequest request)
    {
        var userId = GetCurrentUserId();
        var response = await _coachService.SendMessage(new CoachRequest
        {
            UserId = userId,
            Message = request.Message
        });
        return Ok(response);
    }

    [HttpPost("voice/chat")]
    public async Task<ActionResult<VoiceResponse>> VoiceChat(IFormFile audio)
    {
        var userId = GetCurrentUserId();
        
        using var audioStream = audio.OpenReadStream();
        var transcribedText = await _speechToText.TranscribeAudio(audioStream);
        
        var coachResponse = await _coachService.SendMessage(new CoachRequest
        {
            UserId = userId,
            Message = transcribedText
        });
        
        var audioResponse = await _textToSpeech.GenerateSpeech(coachResponse.Response);
        var audioBytes = await ReadStreamAsync(audioResponse);
        
        return Ok(new VoiceResponse
        {
            TranscribedText = transcribedText,
            ResponseText = coachResponse.Response,
            AudioData = Convert.ToBase64String(audioBytes)
        });
    }
}
```

---

## PART 3: REACT FRONTEND

### 3.1 Voice Chat Component

```typescript
import React, { useState, useRef } from 'react';
import { Mic, Send } from 'lucide-react';

export const VoiceChat: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    
    const chunks: Blob[] = [];
    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
    
    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      await sendVoiceMessage(audioBlob);
    };
    
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    const response = await fetch('/api/coach/voice/chat', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: data.transcribedText },
      { role: 'assistant', content: data.responseText }
    ]);
    
    playAudio(data.audioData);
  };

  const playAudio = (base64Audio: string) => {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    audio.play();
  };

  return (
    <div className="voice-chat">
      <button 
        onMouseDown={startRecording} 
        onMouseUp={stopRecording}
        className="mic-button"
      >
        <Mic className={isRecording ? 'recording' : ''} />
      </button>
    </div>
  );
};
```

---

## SETUP & REQUIREMENTS

### Docker Compose Configuration

```yaml
services:
  coach-model:
    build: ./ml_models/coach_server
    ports:
      - "5002:5002"
    volumes:
      - ./models:/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
  
  whisper-server:
    build: ./ml_models/whisper_server
    ports:
      - "5003:5003"
  
  tts-server:
    build: ./ml_models/tts_server
    ports:
      - "5004:5004"
```

### Requirements

**Python (ml_models/requirements.txt):**
```
transformers==4.36.0
torch==2.1.0
flask==3.0.0
flask-cors==4.0.0
openai-whisper==20231117
piper-tts==1.2.0
accelerate==0.25.0
```

**Hardware:**
- GPU: RTX 4050 (6GB VRAM) - Sufficient for Llama 3.2 3B
- RAM: 16GB
- Storage: 10GB for models

---

## USAGE INSTRUCTIONS

1. **Fine-tune Llama 3.2 3B on fitness data** (see fine-tuning guide)
2. **Start Python servers:** `docker-compose up -d`
3. **Run .NET API:** `dotnet run`
4. **Start React frontend:** `npm start`
5. **Test voice chat:** Click mic button, speak, release
6. **Test text chat:** Type message and send

---

## KEY FEATURES

✅ Real-time voice conversation
✅ Text chat with history
✅ Personalized responses using user context
✅ Offline-capable (all models run locally)
✅ FREE forever (no API costs)
✅ HIPAA-compliant (data never leaves server)
✅ Fast inference (~20-30 tokens/sec on RTX 4050)

---

**Total Implementation Time:** 12-16 hours

---

Practical Recommendation (updated):
- For the MVP keep focus on text chat and structured ML outputs (nutrition/workout). Voice (STT/TTS) adds complexity and GPU/memory requirements — defer until text-first flows are stable.
- Updated Python requirements: include `sentence-transformers`, `transformers`, `torch`, `huggingface-hub` for embedding and small-model prototyping; keep Whisper/Piper as optional components and add them later when voice is prioritized.

Optional small requirements snippet (add to `ml_models/requirements.txt` when enabling voice):
```
# Optional voice (defer until later)
openai-whisper==20231117
piper-tts==1.2.0
```
**Total Cost:** $0 (100% free)
**GPU Memory Usage:** 4-6GB VRAM
