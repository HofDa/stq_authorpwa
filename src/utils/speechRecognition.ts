import type { Locale } from '@/schema';

export interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

export interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: () => void;
  onend: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechRecognitionWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export function speechLocale(locale: Locale): string {
  return locale === 'de' ? 'de-DE' : locale === 'it' ? 'it-IT' : 'en-US';
}

export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as SpeechRecognitionWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function supportsSpeechRecognition() {
  return Boolean(getSpeechRecognitionConstructor());
}

export function readSpeechTranscript(event: SpeechRecognitionEventLike) {
  let text = '';
  for (let i = 0; i < event.results.length; i += 1) {
    text += event.results[i][0].transcript;
  }
  return text;
}
