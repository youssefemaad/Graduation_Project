"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { vapi } from "@/lib/vapi";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mic, ArrowRight, Square, Bot, Sparkles, Loader2, Ticket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
}

function GenerateProgramContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Vapi State
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);

  const messageContainerRef = useRef<HTMLDivElement>(null);

  // --- Vapi Logic ---
  useEffect(() => {
    const handleCallStart = () => {
      setCallActive(true);
      setConnecting(false);
    };

    const handleCallEnd = () => {
      setCallActive(false);
      setConnecting(false);
    };

    const handleMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage: VoiceMessage = {
          content: message.transcript,
          role: message.role === "assistant" ? "assistant" : "user"
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);

    return () => {
      vapi.stop();
      vapi.removeAllListeners();
    };
  }, []);

  const toggleCall = async () => {
    if (callActive) {
      vapi.stop();
    } else {
      if ((user?.tokenBalance ?? 0) < 50) {
        showToast("You need at least 50 tokens to generate a program", "error");
        return;
      }

      setConnecting(true);
      try {
        const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
        if (!workflowId) {
          showToast("Voice service not configured", "error");
          setConnecting(false);
          return;
        }
        await vapi.start(workflowId);
      } catch (e) {
        console.error("Vapi start failed", e);
        showToast("Failed to start voice session", "error");
        setConnecting(false);
      }
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-50 relative pb-24">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-white/80 backdrop-blur-md" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Generate Your Workout Plan</h1>
          <p className="text-slate-500">Talk to our AI coach to create a personalized program</p>
        </div>

        {/* Token Balance */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
            <Ticket className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-slate-900">{user?.tokenBalance ?? 0}</span>
            <span className="text-slate-500 text-sm">tokens available</span>
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
          <div className="p-6 md:p-8">
            {/* Voice Interaction Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Voice Button */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Talk to AI Coach</h3>
                <p className="text-slate-500 text-sm">
                  Tell the AI about your goals, preferences, and any limitations. For example:
                  &quot;I want to build muscle, training 4 days a week, focus on upper body.&quot;
                </p>

                <div
                  onClick={toggleCall}
                  className={`relative cursor-pointer transition-all duration-300 border-2 rounded-2xl h-64 flex flex-col items-center justify-center gap-4 ${callActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 border-dashed bg-slate-50 hover:bg-slate-100"
                    }`}
                >
                  {/* Pulse Animation */}
                  {callActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 bg-blue-500/10 rounded-full animate-ping" />
                    </div>
                  )}

                  <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all ${callActive
                    ? "bg-red-500 shadow-lg"
                    : "bg-blue-600 shadow-lg"
                    }`}>
                    {connecting ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : callActive ? (
                      <Square className="h-8 w-8 text-white fill-white" />
                    ) : (
                      <Mic className="h-8 w-8 text-white" />
                    )}
                  </div>

                  <div className="text-center z-10">
                    <h4 className="font-bold text-slate-900 text-lg">
                      {connecting ? "Connecting..." : callActive ? "Listening..." : "Tap to Speak"}
                    </h4>
                    <p className="text-slate-400 text-xs mt-1">
                      {callActive ? "Tap to stop" : "Start a voice conversation"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Conversation Display */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Conversation</h3>
                <div
                  ref={messageContainerRef}
                  className="min-h-[250px] max-h-[350px] overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <Bot className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">
                          Start speaking to see the conversation here
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-blue-100 text-blue-600'
                          }`}>
                          {msg.role === 'assistant'
                            ? <Bot className="h-4 w-4" />
                            : <span className="text-xs font-bold">ME</span>
                          }
                        </div>
                        <div className={`p-3 rounded-xl text-sm max-w-[85%] ${msg.role === 'assistant'
                          ? 'bg-white text-slate-700 rounded-tl-none shadow-sm'
                          : 'bg-blue-600 text-white rounded-tr-none'
                          }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Cost Info */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-orange-500" />
                Generating a plan costs <span className="text-slate-900 font-bold">50 Tokens</span>
              </div>

              <Button
                disabled={(user?.tokenBalance ?? 0) < 50}
                className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl font-bold gap-2"
                onClick={() => router.push('/programs')}
              >
                View My Plans <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Text */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Voice conversations are processed securely. Your workout plan will be saved to your account.
        </p>
      </div>
    </div>
  );
}

export default function GenerateProgramPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <GenerateProgramContent />
    </ProtectedRoute>
  );
}
