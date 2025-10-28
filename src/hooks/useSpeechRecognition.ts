import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionOptions {
  onEnd?: (finalTranscript: string) => void;
}

export const useSpeechRecognition = ({ onEnd }: SpeechRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any | null>(null);
  const onEndRef = useRef(onEnd);
  const speechEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
  }, []);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech Recognition is not supported in this browser.');
      setError('التعرف على الصوت غير مدعوم في هذا المتصفح.');
      return;
    }

    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;

    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setInterimTranscript('');
      finalTranscriptRef.current = '';
    };

    recognition.onresult = (event: any) => {
      if (speechEndTimeoutRef.current) {
        clearTimeout(speechEndTimeoutRef.current);
      }

      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }
      setInterimTranscript(interim);
      if (final) {
        finalTranscriptRef.current += final.trim() + ' ';
      }
      
      // Auto-stop after a pause
      speechEndTimeoutRef.current = setTimeout(() => {
            stopListening();
      }, 1500);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
       let errorMessage = 'حدث خطأ غير معروف في التعرف على الصوت.';
      switch (event.error) {
          case 'network':
              errorMessage = 'مشكلة في الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
              break;
          case 'not-allowed':
          case 'service-not-allowed':
              errorMessage = 'تم رفض الوصول إلى الميكروفون. يرجى تمكين الوصول.';
              break;
          case 'no-speech':
              errorMessage = 'لم يتم اكتشاف أي كلام. حاول التحدث بوضوح.';
              break;
          case 'audio-capture':
              errorMessage = 'فشل التقاط الصوت. تأكد من أن الميكروفون يعمل.';
              break;
      }
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (speechEndTimeoutRef.current) clearTimeout(speechEndTimeoutRef.current);
      setIsListening(false);
      setInterimTranscript('');
      if (onEndRef.current && finalTranscriptRef.current.trim()) {
        onEndRef.current(finalTranscriptRef.current.trim());
      }
      finalTranscriptRef.current = '';
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [stopListening]);

  const startListening = useCallback(() => {
    if (isListening || !recognitionRef.current) return;
    try {
        recognitionRef.current.start();
    } catch (e) {
        console.error("Could not start recognition:", e);
        setError("لم يتمكن من بدء التعرف على الصوت.");
        setIsListening(false);
    }
  }, [isListening]);

  return { isListening, interimTranscript, error, startListening, stopListening };
};
