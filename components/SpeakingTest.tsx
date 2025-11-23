import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { evaluateSpeaking } from '../services/geminiService';
import { ChatMessage, TestResult } from '../types';
import { Mic, MicOff, Square, Bot, Loader2, Volume2, Power, Timer, AudioWaveform, Bell, CheckCircle2, User, Radio } from 'lucide-react';

interface SpeakingTestProps {
  onComplete: (result: TestResult) => void;
}

const PART_1_TOPICS = [
  "Work and Studies", "Hometown", "Daily Routine", "Hobbies", "Weather",
  "Travel", "Technology", "Food", "Sports", "Music", "Neighbors"
];

const PART_2_TOPICS = [
  "Describe a memorable journey you have taken.",
  "Describe a book you read recently that you found useful.",
  "Describe a time when you helped someone.",
  "Describe a piece of technology you use often.",
  "Describe a place you visited on vacation that you liked.",
  "Describe a skill you would like to learn in the future."
];

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const SpeakingTest: React.FC<SpeakingTestProps> = ({ onComplete }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isExaminerSpeaking, setIsExaminerSpeaking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'grading'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPart, setCurrentPart] = useState<string>('INTRO');
  const [transitionMsg, setTransitionMsg] = useState<string | null>(null);
  
  const historyRef = useRef<ChatMessage[]>([]);
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');
  
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recorderDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  
  const stopSessionRef = useRef<() => void>(() => {});

  const apiKey = process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'connected') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (transitionMsg) {
      const timer = setTimeout(() => setTransitionMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [transitionMsg]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const safelyCloseContext = async (ctx: AudioContext | null) => {
    if (ctx && ctx.state !== 'closed') {
      try {
        await ctx.close();
      } catch (e) {
        console.warn("Context already closed or failed to close", e);
      }
    }
  };

  const stopSession = async () => {
    stopSessionRef.current(); 
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    await safelyCloseContext(inputContextRef.current);
    await safelyCloseContext(outputContextRef.current);
    
    inputContextRef.current = null;
    outputContextRef.current = null;
    nextStartTimeRef.current = 0;
    
    setIsConnected(false);
    setIsExaminerSpeaking(false);
  };

  const finishTest = async () => {
    stopSessionRef.current(); 
    
    let recordingUrl = '';
    
    if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== 'inactive') {
            const stopPromise = new Promise<void>((resolve) => {
                mediaRecorderRef.current!.onstop = () => resolve();
                mediaRecorderRef.current!.stop();
            });
            await stopPromise;
        }
        
        if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
            recordingUrl = URL.createObjectURL(blob);
        }
    }

    await safelyCloseContext(inputContextRef.current);
    await safelyCloseContext(outputContextRef.current);
    
    setIsConnected(false);
    setStatus('grading');

    try {
      if (currentInputTransRef.current) {
         historyRef.current.push({ role: 'user', text: currentInputTransRef.current, timestamp: Date.now() });
      }
      if (currentOutputTransRef.current) {
         historyRef.current.push({ role: 'model', text: currentOutputTransRef.current, timestamp: Date.now() });
      }

      const result = await evaluateSpeaking(historyRef.current);
      result.recordingUrl = recordingUrl;
      onComplete(result);
    } catch (e) {
      console.error("Grading failed", e);
      alert("Error generating feedback. Please try again.");
      setStatus('idle');
    }
  };

  const startTest = async () => {
    if (!apiKey) {
      alert("API Key is missing.");
      return;
    }

    try {
      setStatus('connecting');
      setElapsedTime(0);
      setCurrentPart('INTRO');
      historyRef.current = [];
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
          } 
      });
      
      recordedChunksRef.current = [];
      const recorderDest = outputCtx.createMediaStreamDestination();
      recorderDestinationRef.current = recorderDest;
      
      const micSourceForRecord = outputCtx.createMediaStreamSource(stream);
      micSourceForRecord.connect(recorderDest);
      
      const recorder = new MediaRecorder(recorderDest.stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      
      const part1Topic = PART_1_TOPICS[Math.floor(Math.random() * PART_1_TOPICS.length)];
      const part2Topic = PART_2_TOPICS[Math.floor(Math.random() * PART_2_TOPICS.length)];

      const setExamPartTool: FunctionDeclaration = {
        name: "setExamPart",
        description: "Updates the current section of the IELTS speaking exam. MUST be called when transitioning between parts.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            part: {
              type: Type.STRING,
              description: "The exam part identifier.",
              enum: ["INTRO", "PART_1", "PART_2", "PART_3", "FINISHED"]
            }
          },
          required: ["part"]
        }
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          tools: [{ functionDeclarations: [setExamPartTool] }],
          systemInstruction: `You are a professional IELTS Speaking Examiner named Mr. Gemini. 
          Conduct a formal IELTS Speaking test.
          
          PHASES:
          1. **INTRO**: Introduce yourself, check ID.
          2. **PART_1**: Ask 3 questions about "${part1Topic}".
          3. **PART_2**: Give topic: "${part2Topic}". Allow 10s thinking time, then ask user to speak.
          4. **PART_3**: Ask 2 abstract questions related to "${part2Topic}".
          5. **FINISHED**: End test.

          CRITICAL RULES:
          - Use \`setExamPart\` tool before starting each new phase.
          - AFTER asking a question, STOP SPEAKING and WAIT for the user to answer.
          - Do NOT interrupt the user.
          - Do NOT answer the questions yourself.
          - Start the conversation ONLY after receiving the "START" signal from the system.
          `,
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setStatus('connected');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            
            const muteNode = inputCtx.createGain();
            muteNode.gain.value = 0;
            scriptProcessor.connect(muteNode);
            muteNode.connect(inputCtx.destination);

            sessionPromise.then(session => session.sendRealtimeInput({
                text: "The student is ready. Start the exam now with the Introduction."
            }));
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls.length > 0) {
                 const call = functionCalls[0];
                 if (call.name === 'setExamPart') {
                    const args = call.args as any;
                    const newPart = args.part;
                    
                    if (newPart === 'FINISHED') {
                       setTransitionMsg("Test Completed");
                    } else {
                        setCurrentPart(newPart);
                        setTransitionMsg(`Starting ${newPart.replace('_', ' ')}`);
                    }

                    sessionPromise.then(session => session.sendToolResponse({
                        functionResponses: {
                            name: call.name,
                            id: call.id,
                            response: { result: "ok" }
                        }
                    }));
                 }
              }
            }

            const serverContent = message.serverContent;
            if (serverContent) {
                if (serverContent.inputTranscription) {
                    currentInputTransRef.current += serverContent.inputTranscription.text;
                }
                if (serverContent.outputTranscription) {
                    currentOutputTransRef.current += serverContent.outputTranscription.text;
                }
                
                if (serverContent.turnComplete) {
                    if (currentInputTransRef.current.trim()) {
                        historyRef.current.push({
                            role: 'user',
                            text: currentInputTransRef.current,
                            timestamp: Date.now()
                        });
                        currentInputTransRef.current = '';
                    }
                    if (currentOutputTransRef.current.trim()) {
                        historyRef.current.push({
                            role: 'model',
                            text: currentOutputTransRef.current,
                            timestamp: Date.now()
                        });
                        currentOutputTransRef.current = '';
                    }
                }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               try {
                   const audioBuffer = await decodeAudioData(
                     base64ToUint8Array(base64Audio),
                     outputCtx,
                     24000,
                     1
                   );
                   
                   const source = outputCtx.createBufferSource();
                   source.buffer = audioBuffer;
                   
                   source.connect(outputCtx.destination);
                   if (recorderDest) {
                     source.connect(recorderDest);
                   }

                   const start = Math.max(outputCtx.currentTime, nextStartTimeRef.current);
                   source.start(start);
                   nextStartTimeRef.current = start + audioBuffer.duration;
                   
                   setIsExaminerSpeaking(true);
                   source.onended = () => {
                       if (outputCtx.currentTime >= nextStartTimeRef.current - 0.1) {
                           setIsExaminerSpeaking(false);
                       }
                   };
               } catch (err) {
                   console.error("Audio decoding error", err);
               }
            }
          },
          onclose: () => {
            console.log("Session closed");
          },
          onerror: (e) => {
            console.error("Session error", e);
          }
        }
      });
      
      stopSessionRef.current = () => {
          sessionPromise.then(session => session.close());
      };

    } catch (error) {
      console.error("Failed to start test:", error);
      setStatus('idle');
      alert("Microphone access required or API error.");
    }
  };

  if (status === 'grading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-fade-in">
         <div className="relative">
             <div className="w-24 h-24 border-t-4 border-l-4 border-blue-500 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                 <Bot className="w-10 h-10 text-slate-400" />
             </div>
         </div>
         <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Generating Feedback</h2>
            <p className="text-slate-500 max-w-sm mx-auto">Evaluating your pronunciation, grammar, and fluency against IELTS criteria...</p>
         </div>
      </div>
    );
  }

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in-up">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-white text-center max-w-lg w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Mic size={36} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Speaking Test</h2>
            <p className="text-slate-500 mb-10 leading-relaxed text-lg">
                Engage in a 15-minute, 3-part interactive interview with an AI examiner.
            </p>
            
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 text-left flex items-start gap-3">
                <Bell className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-amber-800 font-medium">For the best experience, please use headphones and find a quiet room.</p>
            </div>

            <button 
                onClick={startTest}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-3 text-lg"
            >
                <Mic size={22} />
                Start Interview
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      {/* Immersive Visualizer */}
      <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-950 to-black rounded-3xl relative overflow-hidden flex flex-col items-center justify-center shadow-2xl ring-1 ring-slate-900/10">
         
         {/* Ambient Glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>

         {/* Examiner Avatar */}
         <div className="relative z-10 flex flex-col items-center mb-16">
            <div className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 ${isExaminerSpeaking ? 'scale-110' : 'scale-100'}`}>
                {/* Ripples when speaking */}
                {isExaminerSpeaking && (
                    <>
                        <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-[ping_2s_linear_infinite]"></div>
                        <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-[ping_2s_linear_infinite_1s]"></div>
                    </>
                )}
                
                <div className={`w-36 h-36 rounded-full flex items-center justify-center border-4 z-10 bg-slate-800 ${isExaminerSpeaking ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.4)]' : 'border-slate-700'}`}>
                     <Bot size={64} className={isExaminerSpeaking ? 'text-blue-400' : 'text-slate-500'} />
                </div>
            </div>
            <div className="mt-6 text-center">
                <h3 className="text-white font-bold text-2xl tracking-tight">Mr. Gemini</h3>
                <p className="text-blue-400/80 text-sm font-medium uppercase tracking-widest mt-1">IELTS Examiner</p>
            </div>
         </div>

         {/* User Visualizer / Status */}
         <div className="relative z-10 w-full max-w-sm px-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isExaminerSpeaking ? 'bg-slate-700 text-slate-400' : 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]'}`}>
                    <User size={24} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                         <span className="text-white text-sm font-semibold">
                             {isExaminerSpeaking ? 'Listening...' : 'Your Turn'}
                         </span>
                         { !isExaminerSpeaking && (
                             <span className="flex items-center gap-1.5">
                                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                 <span className="text-green-400 text-xs font-bold">LIVE</span>
                             </span>
                         )}
                    </div>
                    {/* Fake waveform bars */}
                    <div className="flex items-center gap-1 h-4">
                        {[...Array(12)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-1 rounded-full transition-all duration-150 ${isExaminerSpeaking ? 'h-1 bg-slate-600' : `bg-green-400 ${['h-2','h-4','h-3','h-2'][i%4]} animate-pulse`}`}
                                style={{ animationDelay: `${i * 0.1}s` }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
         </div>
         
         {/* Phase Indicator */}
         <div className="absolute top-8 left-0 right-0 flex justify-center z-20">
             <div className="bg-black/40 backdrop-blur-xl text-white text-xs font-bold px-5 py-2 rounded-full border border-white/10 uppercase tracking-widest flex items-center gap-2">
                 <Radio size={12} className="text-red-500 animate-pulse" />
                 {currentPart.replace('_', ' ')}
             </div>
         </div>

         {/* Toasts */}
         {transitionMsg && (
             <div className="absolute top-24 z-30 animate-fade-in-down">
                 <div className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold border border-blue-400/30">
                     <Bell size={20} className="fill-current" />
                     {transitionMsg}
                 </div>
             </div>
         )}
      </div>

      {/* Controls Footer */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                <Timer size={18} className="text-slate-500" />
                <span className="font-mono font-bold text-slate-700 text-lg">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                {isConnected ? 'Connected' : 'Connecting...'}
            </div>
         </div>
         
         <button 
            onClick={finishTest}
            className="group bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-transparent hover:border-red-200"
         >
            <Power size={18} className="group-hover:scale-110 transition-transform" />
            End Test
         </button>
      </div>
    </div>
  );
};

export default SpeakingTest;