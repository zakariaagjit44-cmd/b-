import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Sender } from './types';
import { getAiResponseStream, getFinalEvaluation, getAiSpeech } from './services/geminiService';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import Header from './components/Header';
import ChatBubble from './components/ChatBubble';
import MessageInput from './components/MessageInput';
import ScoreCard from './components/ScoreCard';
import { StartIcon, StopIcon } from './components/Icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1, // Start with a stable ID
      text: "مرحبًا! أنا مساعدك الآلي للتدريب على امتحان Telc. اضغط على زر الميكروفون لبدء المحادثة.",
      sender: Sender.AI,
    },
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [finalScore, setFinalScore] = useState<{ score: number; feedback: string } | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const { speak } = useSpeechSynthesis();
  
  const handleUserMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const newUserMessage: Message = { id: Date.now(), text, sender: Sender.USER };
    
    // Add user message and a placeholder for AI response to the UI
    setMessages((prev) => [...prev, newUserMessage, { id: Date.now() + 1, text: '', sender: Sender.AI, isStreaming: true }]);
    setIsAiResponding(true);

    try {
        // The `messages` variable from the closure contains the correct history *before* the new message.
        const stream = getAiResponseStream(messages, text);
        let fullAiText = '';
        
        for await (const chunkText of stream) {
            fullAiText += chunkText;
            setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.sender === Sender.AI) {
                    const updatedMessages = [...prev.slice(0, -1)];
                    updatedMessages.push({ ...lastMessage, text: fullAiText });
                    return updatedMessages;
                }
                return prev;
            });
        }
        
        // Finalize the AI message
        setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.sender === Sender.AI) {
                const updatedMessages = [...prev.slice(0, -1)];
                updatedMessages.push({ ...lastMessage, isStreaming: false });
                return updatedMessages;
            }
            return prev;
        });

        if (fullAiText) {
            const audioData = await getAiSpeech(fullAiText);
            speak(audioData);
        } else {
             // Remove placeholder if no text was generated
            setMessages(prev => prev.filter(msg => msg.text || msg.sender === Sender.USER));
        }

    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessageText = "عذرًا، حدث خطأ أثناء محاولة الاتصال. يرجى المحاولة مرة أخرى.";
      setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.sender === Sender.AI) {
                const updatedMessages = [...prev.slice(0, -1)];
                updatedMessages.push({ ...lastMessage, text: errorMessageText, isStreaming: false });
                return updatedMessages;
            }
            return prev;
        });
    } finally {
        setIsAiResponding(false);
    }
  }, [speak, messages]);

  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition({
    onEnd: (finalTranscript: string) => {
      if (finalTranscript.trim()) {
        handleUserMessage(finalTranscript);
      }
    }
  });

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);
  
  const handleStartSession = () => {
    setSessionStarted(true);
    setFinalScore(null);
    const startMessage: Message = {
      id: Date.now(),
      text: "Sehr gut! Fangen wir an. Erzählen Sie mir bitte ein bisschen über sich.",
      sender: Sender.AI,
    };
    setMessages([startMessage]);
    getAiSpeech(startMessage.text).then(speak).catch(e => console.error("Speech synthesis failed on start", e));
  }

  const handleEndSession = async () => {
    setIsAiResponding(true);
    try {
      const result = await getFinalEvaluation(messages);
      setFinalScore(result);
      const evaluationMessage: Message = {
        id: Date.now() + 1,
        text: "لقد كانت محادثة رائعة. إليك تقييمي لأدائك.",
        sender: Sender.AI,
      };
      
      setMessages((prev) => [...prev, evaluationMessage]);
      
    } catch (error) {
      console.error("Error getting final evaluation:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "عذرًا، لم أتمكن من إتمام التقييم. يرجى المحاولة مرة أخرى.",
        sender: Sender.AI,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiResponding(false);
      setSessionStarted(false);
    }
  };

  const handleToggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!sessionStarted) {
        handleStartSession();
      }
      startListening();
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 text-gray-800">
      <div className="w-full max-w-2xl h-[95vh] sm:h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <Header />
        <div ref={chatBoxRef} className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {interimTranscript && (
             <div className="flex justify-end animate-fade-in-up">
                <div className="bg-blue-100 text-gray-500 rounded-2xl rounded-br-none px-4 py-3 max-w-md">
                    <p className="text-sm">{interimTranscript}</p>
                </div>
            </div>
          )}
        </div>
        
        {finalScore && <ScoreCard score={finalScore.score} feedback={finalScore.feedback} />}

        <div className="p-4 bg-white border-t border-gray-200">
            {speechError && <p className="text-center text-red-500 text-sm mb-2" role="alert">{speechError}</p>}
            <div className="flex items-center space-x-2 space-x-reverse">
            {sessionStarted && !finalScore && (
                 <button 
                    onClick={handleEndSession}
                    disabled={isAiResponding || isListening}
                    className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 disabled:opacity-50 transition-all">
                    إنهاء وتقييم
                </button>
            )}

            <MessageInput onSendMessage={handleUserMessage} disabled={isListening || isAiResponding || !sessionStarted} />

            <button
                onClick={handleToggleRecording}
                disabled={isAiResponding || !!finalScore}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
                className={`p-3 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400'
                }`}
            >
                {isListening ? <StopIcon /> : <StartIcon />}
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
