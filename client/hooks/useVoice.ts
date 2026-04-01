/**
 * useVoice — Hook pour la reconnaissance vocale (Web Speech API)
 *
 * Utilisé par :
 * - Les clients : parler à l'IA en marchant, mains libres
 * - L'équipe : dicter des fiches établissements à l'IA
 *
 * Supporte : Chrome, Edge, Safari (mobile + desktop)
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceOptions {
  language?: string;
  continuous?: boolean;
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
}

interface UseVoiceReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const { language = 'fr-FR', continuous = true, onResult, onEnd } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Check browser support
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim = result[0].transcript;
        }
      }
      const full = (finalTranscript + interim).trim();
      setTranscript(full);
    };

    recognition.onend = () => {
      setIsListening(false);
      const final = finalTranscript.trim();
      if (final && onResult) {
        onResult(final);
      }
      if (onEnd) onEnd();
      finalTranscript = '';
    };

    recognition.onerror = (event: any) => {
      console.warn('[VOICE] Error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    return recognition;
  }, [isSupported, language, continuous, onResult, onEnd]);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    const recognition = createRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;
    setTranscript('');
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error('[VOICE] Start error:', e);
    }
  }, [isSupported, createRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening,
  };
}
