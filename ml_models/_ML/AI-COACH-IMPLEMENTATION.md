# AI Coach Assistant Implementation Guide

## Overview

Add a conversational AI coach that can:
- 🎙️ **Voice Calls**: Real-time voice conversations using OpenAI Realtime API
- 💬 **Text Chat**: Chat-based coaching using GPT-4
- 📊 **Personalized Guidance**: Context-aware recommendations based on user data
- 📈 **Progress Tracking**: Follow-up and motivation coaching
- 🏋️ **Workout & Nutrition Planning**: Conversational plan creation

## Architecture Options

### Option 1: OpenAI Realtime API (Recommended) ⭐

**Pros:**
- Native speech-to-speech (no separate TTS/STT needed)
- Low latency (~300ms)
- Multimodal (text, audio, images)
- Function calling support
- Built-in voice options

**Cons:**
- Higher cost ($0.06/min audio input, $0.24/min audio output)
- Requires WebSocket/WebRTC connection
- 30-minute session limit

**Use Case:** Premium voice coaching feature

### Option 2: Azure Speech Services + GPT-4

**Pros:**
- More cost-effective
- Better control over speech synthesis
- No session time limits
- Works with existing GPT-4 infrastructure

**Cons:**
- Higher latency (separate TTS/STT calls)
- More complex integration
- Need to manage audio streaming

**Use Case:** Budget-friendly voice + standard chat

### Option 3: Hybrid Approach (Best of Both)

- **Voice Calls**: OpenAI Realtime API
- **Text Chat**: GPT-4 Turbo
- **Voice Messages**: Azure Speech Services

---

## Implementation: OpenAI Realtime API + GPT-4 Chat

### Phase 1: Backend API Setup

#### 1.1 Create AI Coach Service Interface

**File:** `Core/Interfaces/Services/IAICoachService.cs`

```csharp
public interface IAICoachService
{
    // Chat Methods
    Task<CoachChatResponse> SendMessage(int userId, string message, CoachContext context);
    Task<List<CoachMessage>> GetConversationHistory(int userId, int limit = 50);
    
    // Voice Session Methods
    Task<VoiceSessionInfo> InitializeVoiceSession(int userId);
    Task EndVoiceSession(string sessionId);
    Task<VoiceSessionToken> GetVoiceSessionToken(int userId);
    
    // Context Methods
    Task<CoachContext> BuildUserContext(int userId);
    Task SaveConversation(int userId, CoachMessage message);
    
    // Plan Generation via Conversation
    Task<WorkoutPlan> GenerateWorkoutFromConversation(int userId, string conversationId);
    Task<NutritionPlan> GenerateNutritionFromConversation(int userId, string conversationId);
}

public class CoachContext
{
    public UserProfile User { get; set; }
    public List<WorkoutSession> RecentWorkouts { get; set; }
    public NutritionAdherence RecentNutrition { get; set; }
    public UserProgress ProgressMetrics { get; set; }
    public List<string> UserGoals { get; set; }
    public DateTime LastCheckIn { get; set; }
}

public class CoachChatResponse
{
    public string MessageId { get; set; }
    public string Content { get; set; }
    public List<string> SuggestedActions { get; set; }
    public bool RequiresWorkoutPlan { get; set; }
    public bool RequiresNutritionPlan { get; set; }
    public DateTime Timestamp { get; set; }
}

public class VoiceSessionInfo
{
    public string SessionId { get; set; }
    public string WebSocketUrl { get; set; }
    public string ClientToken { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string Voice { get; set; } // alloy, echo, fable, onyx, nova, shimmer
}
```

#### 1.2 Implement AI Coach Service

**File:** `Infrastructure/Services/AICoachService.cs`

```csharp
// Use open-source LLMs or hosted HF inference for MVP (avoid OpenAI cost)
// Recommended: prototype with small instruction-tuned models and RAG using local embeddings.
// Example LLM options (choose based on GPU availability):
// - `sentence-transformers` for embeddings (all-MiniLM-L6-v2, 384 dim) — runs on CPU well.
// - For small-chat prototypes use: `meta-llama/Llama-2-7b-chat` (GPU required) or hosted HF inference.
// - For on-premise low-resource prototyping prefer `small instruction-tuned` models or hosted endpoints.

// Note: Voice/Realtime services are optional and deferred; prioritize text chat + structured model outputs.

public class AICoachService : IAICoachService
{
    private readonly OpenAIClient _openAIClient;
    private readonly IUserRepository _userRepository;
    private readonly IWorkoutRepository _workoutRepository;
    private readonly INutritionRepository _nutritionRepository;
    private readonly IConfiguration _config;
    private readonly ILogger<AICoachService> _logger;

    public AICoachService(
        OpenAIClient openAIClient,
        IUserRepository userRepository,
        IWorkoutRepository workoutRepository,
        INutritionRepository nutritionRepository,
        IConfiguration config,
        ILogger<AICoachService> logger)
    {
        _openAIClient = openAIClient;
        _userRepository = userRepository;
        _workoutRepository = workoutRepository;
        _nutritionRepository = nutritionRepository;
        _config = config;
        _logger = logger;
    }

    public async Task<CoachChatResponse> SendMessage(
        int userId, 
        string message, 
        CoachContext context)
    {
        try
        {
            var systemPrompt = BuildCoachSystemPrompt(context);
            var conversationHistory = await GetConversationHistory(userId, 20);

            var chatClient = _openAIClient.GetChatClient("gpt-4o");
            
            var messages = new List<ChatMessage>
            {
                new SystemChatMessage(systemPrompt)
            };

            // Add conversation history
            foreach (var msg in conversationHistory)
            {
                if (msg.Role == "user")
                    messages.Add(new UserChatMessage(msg.Content));
                else
                    messages.Add(new AssistantChatMessage(msg.Content));
            }

            // Add current message
            messages.Add(new UserChatMessage(message));

            var response = await chatClient.CompleteChatAsync(messages, new ChatCompletionOptions
            {
                Temperature = 0.7f,
                MaxTokens = 500,
                Functions = GetAvailableFunctions()
            });

            var assistantMessage = response.Value.Content[0].Text;

            // Save conversation
            await SaveConversation(userId, new CoachMessage
            {
                Role = "user",
                Content = message,
                Timestamp = DateTime.UtcNow
            });

            await SaveConversation(userId, new CoachMessage
            {
                Role = "assistant",
                Content = assistantMessage,
                Timestamp = DateTime.UtcNow
            });

            return new CoachChatResponse
            {
                MessageId = Guid.NewGuid().ToString(),
                Content = assistantMessage,
                SuggestedActions = ExtractSuggestedActions(response),
                RequiresWorkoutPlan = CheckIfWorkoutPlanNeeded(assistantMessage),
                RequiresNutritionPlan = CheckIfNutritionPlanNeeded(assistantMessage),
                Timestamp = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in AI Coach chat");
            throw;
        }
    }

    public async Task<VoiceSessionInfo> InitializeVoiceSession(int userId)
    {
        var context = await BuildUserContext(userId);
        var systemPrompt = BuildCoachSystemPrompt(context);

        // Generate ephemeral token for Realtime API
        var sessionId = Guid.NewGuid().ToString();
        var clientToken = await GenerateEphemeralToken(userId, sessionId);

        return new VoiceSessionInfo
        {
            SessionId = sessionId,
            WebSocketUrl = "wss://api.openai.com/v1/realtime",
            ClientToken = clientToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            Voice = "alloy" // Can be customized per user
        };
    }

    private string BuildCoachSystemPrompt(CoachContext context)
    {
        return $@"You are an expert AI fitness coach and nutritionist for IntelliFit platform.

**Your Role:**
- Provide personalized workout and nutrition guidance
- Motivate and encourage users to reach their fitness goals
- Track progress and adjust plans based on feedback
- Answer fitness and nutrition questions with evidence-based information
- Be supportive, positive, and professional

**User Profile:**
Name: {context.User.FirstName}
Age: {context.User.Age}
Current Weight: {context.User.Weight}kg
Height: {context.User.Height}cm
Fitness Level: {context.User.FitnessLevel}
Goals: {string.Join(", ", context.UserGoals)}

**Recent Activity:**
{(context.RecentWorkouts?.Any() == true 
    ? $"Completed {context.RecentWorkouts.Count} workouts this week" 
    : "No recent workouts")}
Last check-in: {context.LastCheckIn:yyyy-MM-dd}

**Progress:**
{(context.ProgressMetrics != null 
    ? $"Progress: {context.ProgressMetrics.WeightChange:+0.0;-0.0}kg, Strength: {context.ProgressMetrics.StrengthImprovement}%" 
    : "No progress data yet")}

**Guidelines:**
1. Always be encouraging and positive
2. Provide specific, actionable advice
3. Ask clarifying questions when needed
4. Reference their past workouts and progress
5. Suggest workout or nutrition plans when appropriate
6. Use function calls to create plans or retrieve data
7. Keep responses concise (2-3 sentences for voice, 4-5 for chat)

**Available Actions:**
- Generate personalized workout plans
- Create nutrition plans
- Search exercise database
- Track user progress
- Schedule follow-ups";
    }

    private List<ChatFunction> GetAvailableFunctions()
    {
        return new List<ChatFunction>
        {
            new ChatFunction
            {
                FunctionName = "create_workout_plan",
                Description = "Generate a personalized workout plan based on user goals and preferences",
                Parameters = BinaryData.FromString(@"{
                    ""type"": ""object"",
                    ""properties"": {
                        ""duration_weeks"": { ""type"": ""integer"" },
                        ""days_per_week"": { ""type"": ""integer"" },
                        ""focus_area"": { ""type"": ""string"" }
                    },
                    ""required"": [""duration_weeks"", ""days_per_week""]
                }")
            },
            new ChatFunction
            {
                FunctionName = "create_nutrition_plan",
                Description = "Generate a personalized nutrition plan",
                Parameters = BinaryData.FromString(@"{
                    ""type"": ""object"",
                    ""properties"": {
                        ""calorie_target"": { ""type"": ""integer"" },
                        ""dietary_preferences"": { ""type"": ""array"" }
                    }
                }")
            },
            new ChatFunction
            {
                FunctionName = "get_user_progress",
                Description = "Retrieve user's recent progress and statistics",
                Parameters = BinaryData.FromString(@"{
                    ""type"": ""object"",
                    ""properties"": {
                        ""days_back"": { ""type"": ""integer"" }
                    }
                }")
            }
        };
    }

    public async Task<CoachContext> BuildUserContext(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        var recentWorkouts = await _workoutRepository.GetRecentWorkouts(userId, 7);
        var nutritionAdherence = await _nutritionRepository.GetRecentAdherence(userId, 7);
        var progress = await _userRepository.GetProgressMetrics(userId);

        return new CoachContext
        {
            User = user,
            RecentWorkouts = recentWorkouts,
            RecentNutrition = nutritionAdherence,
            ProgressMetrics = progress,
            UserGoals = user.Goals?.ToList() ?? new List<string>(),
            LastCheckIn = user.LastCheckIn ?? DateTime.UtcNow.AddDays(-7)
        };
    }
}
```

#### 1.3 Create AI Coach Controller

**File:** `Graduation-Project/Controllers/AICoachController.cs`

```csharp
[ApiController]
[Route("api/coach")]
[Authorize]
public class AICoachController : ControllerBase
{
    private readonly IAICoachService _coachService;
    private readonly ILogger<AICoachController> _logger;

    public AICoachController(
        IAICoachService coachService,
        ILogger<AICoachController> logger)
    {
        _coachService = coachService;
        _logger = logger;
    }

    /// <summary>
    /// Send a chat message to AI coach
    /// </summary>
    [HttpPost("chat")]
    [ProducesResponseType(typeof(CoachChatResponse), 200)]
    public async Task<IActionResult> Chat([FromBody] CoachChatRequest request)
    {
        var userId = GetUserIdFromClaims();
        var context = await _coachService.BuildUserContext(userId);
        var response = await _coachService.SendMessage(userId, request.Message, context);
        
        return Ok(response);
    }

    /// <summary>
    /// Get conversation history
    /// </summary>
    [HttpGet("conversation/history")]
    [ProducesResponseType(typeof(List<CoachMessage>), 200)]
    public async Task<IActionResult> GetHistory([FromQuery] int limit = 50)
    {
        var userId = GetUserIdFromClaims();
        var history = await _coachService.GetConversationHistory(userId, limit);
        
        return Ok(history);
    }

    /// <summary>
    /// Initialize voice session with AI coach
    /// </summary>
    [HttpPost("voice/session")]
    [ProducesResponseType(typeof(VoiceSessionInfo), 200)]
    public async Task<IActionResult> InitializeVoiceSession()
    {
        var userId = GetUserIdFromClaims();
        var sessionInfo = await _coachService.InitializeVoiceSession(userId);
        
        return Ok(sessionInfo);
    }

    /// <summary>
    /// End voice session
    /// </summary>
    [HttpPost("voice/session/{sessionId}/end")]
    public async Task<IActionResult> EndVoiceSession(string sessionId)
    {
        await _coachService.EndVoiceSession(sessionId);
        return Ok();
    }

    /// <summary>
    /// Generate workout plan from conversation
    /// </summary>
    [HttpPost("generate/workout")]
    [ProducesResponseType(typeof(WorkoutPlanDto), 200)]
    public async Task<IActionResult> GenerateWorkoutFromConversation(
        [FromBody] GeneratePlanRequest request)
    {
        var userId = GetUserIdFromClaims();
        var plan = await _coachService.GenerateWorkoutFromConversation(
            userId, 
            request.ConversationId);
        
        return Ok(plan);
    }

    /// <summary>
    /// Generate nutrition plan from conversation
    /// </summary>
    [HttpPost("generate/nutrition")]
    [ProducesResponseType(typeof(NutritionPlanDto), 200)]
    public async Task<IActionResult> GenerateNutritionFromConversation(
        [FromBody] GeneratePlanRequest request)
    {
        var userId = GetUserIdFromClaims();
        var plan = await _coachService.GenerateNutritionFromConversation(
            userId, 
            request.ConversationId);
        
        return Ok(plan);
    }

    private int GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim!);
    }
}

public class CoachChatRequest
{
    [Required]
    public string Message { get; set; }
    
    public string? Context { get; set; }
}

public class GeneratePlanRequest
{
    [Required]
    public string ConversationId { get; set; }
}
```

---

### Phase 2: Frontend Implementation

#### 2.1 Create AI Coach Service (React/TypeScript)

**File:** `intellifit-frontend/src/services/aiCoach.service.ts`

```typescript
import axios from 'axios';
import { RealtimeClient } from '@openai/realtime-api-beta';

interface CoachChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: string[];
}

interface VoiceSessionInfo {
  sessionId: string;
  webSocketUrl: string;
  clientToken: string;
  expiresAt: string;
  voice: string;
}

export class AICoachService {
  private apiUrl = process.env.REACT_APP_API_URL;
  private realtimeClient: RealtimeClient | null = null;

  // Chat Methods
  async sendChatMessage(message: string): Promise<CoachChatMessage> {
    const response = await axios.post(`${this.apiUrl}/coach/chat`, {
      message
    });
    return response.data;
  }

  async getConversationHistory(limit: number = 50): Promise<CoachChatMessage[]> {
    const response = await axios.get(`${this.apiUrl}/coach/conversation/history`, {
      params: { limit }
    });
    return response.data;
  }

  // Voice Methods
  async initializeVoiceSession(): Promise<VoiceSessionInfo> {
    const response = await axios.post(`${this.apiUrl}/coach/voice/session`);
    return response.data;
  }

  async startVoiceCall(
    onMessage: (message: string) => void,
    onAudioData: (audio: ArrayBuffer) => void
  ): Promise<void> {
    // Get session info from backend
    const sessionInfo = await this.initializeVoiceSession();

    // Initialize Realtime Client
    this.realtimeClient = new RealtimeClient({
      apiKey: sessionInfo.clientToken,
      dangerouslyAllowAPIKeyInBrowser: false // Use backend token
    });

    // Configure session
    await this.realtimeClient.connect();
    
    await this.realtimeClient.updateSession({
      voice: sessionInfo.voice,
      instructions: 'You are a fitness coach. Keep responses concise and motivating.',
      modalities: ['text', 'audio'],
      temperature: 0.7
    });

    // Set up event listeners
    this.realtimeClient.on('conversation.item.created', (event: any) => {
      if (event.item.role === 'assistant' && event.item.content) {
        const transcript = event.item.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('');
        
        onMessage(transcript);
      }
    });

    this.realtimeClient.on('conversation.item.audio', (event: any) => {
      onAudioData(event.audio);
    });

    // Connect microphone
    await this.realtimeClient.startRecording();
  }

  async endVoiceCall(sessionId: string): Promise<void> {
    if (this.realtimeClient) {
      await this.realtimeClient.stopRecording();
      this.realtimeClient.disconnect();
      this.realtimeClient = null;
    }

    await axios.post(`${this.apiUrl}/coach/voice/session/${sessionId}/end`);
  }

  async sendVoiceMessage(audio: ArrayBuffer): Promise<void> {
    if (!this.realtimeClient) {
      throw new Error('Voice session not initialized');
    }

    await this.realtimeClient.sendAudio(audio);
  }

  // Plan Generation
  async generateWorkoutFromConversation(conversationId: string) {
    const response = await axios.post(`${this.apiUrl}/coach/generate/workout`, {
      conversationId
    });
    return response.data;
  }

  async generateNutritionFromConversation(conversationId: string) {
    const response = await axios.post(`${this.apiUrl}/coach/generate/nutrition`, {
      conversationId
    });
    return response.data;
  }
}

export const aiCoachService = new AICoachService();
```

#### 2.2 Create Chat Component

**File:** `intellifit-frontend/src/components/AI/CoachChat.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { aiCoachService } from '../../services/aiCoach.service';
import { FaMicrophone, FaPaperPlane, FaStop } from 'react-icons/fa';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const CoachChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversationHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationHistory = async () => {
    try {
      const history = await aiCoachService.getConversationHistory(20);
      setMessages(history);
    } catch (error) {
      console.error('Failed to load conversation history', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiCoachService.sendChatMessage(inputMessage);
      
      const assistantMessage: Message = {
        id: response.messageId,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(response.timestamp)
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceCall = async () => {
    try {
      setIsVoiceActive(true);
      
      await aiCoachService.startVoiceCall(
        (message) => {
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: message,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        },
        (audioData) => {
          // Play audio
          const audioContext = new AudioContext();
          audioContext.decodeAudioData(audioData, (buffer) => {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start();
          });
        }
      );
    } catch (error) {
      console.error('Failed to start voice call', error);
      setIsVoiceActive(false);
    }
  };

  const stopVoiceCall = async () => {
    try {
      await aiCoachService.endVoiceCall('');
      setIsVoiceActive(false);
    } catch (error) {
      console.error('Failed to stop voice call', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
        <h2 className="text-2xl font-bold">AI Fitness Coach</h2>
        <p className="text-sm opacity-90">Your personal AI coach is here to help!</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isVoiceActive}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || isVoiceActive}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <FaPaperPlane />
          </button>
          <button
            onClick={isVoiceActive ? stopVoiceCall : startVoiceCall}
            className={`px-6 py-2 rounded-lg text-white ${
              isVoiceActive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isVoiceActive ? <FaStop /> : <FaMicrophone />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Click the microphone for voice coaching or type to chat
        </p>
      </div>
    </div>
  );
};
```

---

## Configuration

### appsettings.json

```json
{
  "OpenAI": {
    "ApiKey": "sk-...",
    "ChatModel": "gpt-4o",
    "RealtimeModel": "gpt-4o-realtime-preview",
    "EmbeddingModel": "text-embedding-3-small"
  },
  "AICoach": {
    "DefaultVoice": "alloy",
    "SessionTimeoutMinutes": 30,
    "MaxConversationHistory": 100,
    "EnableVoice": true,
    "Temperature": 0.7,
    "MaxTokens": 500
  }
}
```

### NuGet Packages

```bash
dotnet add package Azure.AI.OpenAI --version 2.0.0
dotnet add package OpenAI --version 2.0.0
```

### NPM Packages

```bash
npm install @openai/realtime-api-beta
npm install axios
npm install react-icons
```

---

## Database Schema

```sql
-- Coach Conversations Table
CREATE TABLE "CoachConversations" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL,
    "ConversationId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "Role" VARCHAR(20) NOT NULL CHECK ("Role" IN ('user', 'assistant', 'system')),
    "Content" TEXT NOT NULL,
    "MessageType" VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'function_call'
    "FunctionCall" JSONB,
    "Timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
    "SessionId" VARCHAR(100),
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE
);

CREATE INDEX "idx_coach_conversations_user" 
ON "CoachConversations"("UserId", "Timestamp" DESC);

CREATE INDEX "idx_coach_conversations_session" 
ON "CoachConversations"("SessionId");

-- Voice Sessions Table
CREATE TABLE "VoiceSessions" (
    "Id" SERIAL PRIMARY KEY,
    "SessionId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "UserId" INTEGER NOT NULL,
    "StartTime" TIMESTAMP NOT NULL DEFAULT NOW(),
    "EndTime" TIMESTAMP,
    "Duration" INTEGER, -- in seconds
    "Voice" VARCHAR(50),
    "AudioInputTokens" INTEGER DEFAULT 0,
    "AudioOutputTokens" INTEGER DEFAULT 0,
    "Status" VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE
);
```

---

## Cost Estimation

### OpenAI Realtime API Pricing
- **Audio Input**: $0.06/min
- **Audio Output**: $0.24/min
- **Text Input/Output**: $2.50/$10 per million tokens

**Example:**
- 10-minute voice call = $0.60 (input) + $2.40 (output) = **$3.00 per call**
- 100 calls/month = **$300/month**

### GPT-4 Chat Pricing
- **Input**: $2.50 per million tokens
- **Output**: $10 per million tokens

**Example:**
- 1,000 chat messages (avg 200 tokens each) = **$2-5/month**

### Recommendation:
- Use **GPT-4 Chat** for standard interactions
- Offer **Voice Calls** as premium feature
- Hybrid: Voice for onboarding, chat for follow-ups

---

## Features

✅ **Real-time voice conversations**  
✅ **Context-aware responses** (user profile, progress, history)  
✅ **Function calling** (create plans, search exercises)  
✅ **Conversation history**  
✅ **Suggested actions**  
✅ **Progress tracking integration**  
✅ **Multi-modal support** (voice + text)  

---

## Next Steps

1. Implement backend `AICoachService`
2. Create API endpoints
3. Build React chat component
4. Add voice call functionality
5. Test with sample conversations
6. Deploy and monitor costs

Your AI Coach is ready to motivate users! 🏋️‍♂️💪
