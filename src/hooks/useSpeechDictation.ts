import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/schema';
import {
  getSpeechRecognitionConstructor,
  readSpeechTranscript,
  speechLocale,
  supportsSpeechRecognition,
  type SpeechRecognitionLike,
} from '@/utils/speechRecognition';

interface UseSpeechDictationOptions {
  locale: Locale;
  onTranscript?: (text: string) => void;
  /**
   * Keeps the previous hold-to-talk fallback behavior for UI that wants
   * immediate tactile feedback even when browser speech recognition is missing.
   */
  recordWhenUnsupported?: boolean;
}

export function useSpeechDictation({
  locale,
  onTranscript,
  recordWhenUnsupported = false,
}: UseSpeechDictationOptions) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const supportsSpeech = useMemo(() => supportsSpeechRecognition(), []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  function applyTranscript(text: string) {
    setTranscript(text);
    onTranscript?.(text);
  }

  function startDictation() {
    if (recording) return;

    const Ctor = getSpeechRecognitionConstructor();
    if (!supportsSpeech || !Ctor) {
      if (recordWhenUnsupported) setRecording(true);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLocale(locale);
    recognition.onresult = (event) => {
      applyTranscript(readSpeechTranscript(event));
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setRecording(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }

  function stopDictation() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);
  }

  function clearTranscript() {
    applyTranscript('');
  }

  return {
    recording,
    supportsSpeech,
    transcript,
    setTranscript: applyTranscript,
    clearTranscript,
    startDictation,
    stopDictation,
  };
}
