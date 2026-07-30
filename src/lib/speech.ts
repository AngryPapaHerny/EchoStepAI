// Speech Recognition & Speech Synthesis Utility for MALL Experience

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export class SpeechHandler {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    this.checkSupport();
  }

  public isSupported(): boolean {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  private checkSupport(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }

  public startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (err: any) => void,
    onEnd?: () => void
  ): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported in this browser.');
      return;
    }

    // Always stop and recreate a fresh recognition instance to avoid InvalidStateError
    this.stopListening();

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          onResult(final, true);
        } else if (interim) {
          onResult(interim, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        if (onError) onError(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
      this.isListening = false;
      if (onError) onError(e);
      if (onEnd) onEnd();
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
      this.isListening = false;
    }
  }

  public speakText(text: string, rate: number = 0.95, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate; // slightly slower for language learners

      const speakWithVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const naturalVoice = voices.find(
          v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('US') || v.name.includes('UK'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (naturalVoice) {
          utterance.voice = naturalVoice;
        }

        utterance.onend = () => {
          if (onEnd) onEnd();
        };

        utterance.onerror = (err) => {
          console.warn('Speech synthesis error:', err);
          if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          speakWithVoice();
        };
        setTimeout(speakWithVoice, 100);
      } else {
        speakWithVoice();
      }
    } catch (e) {
      console.warn('Error playing speech utterance:', e);
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Error stopping speech synthesis:', e);
      }
    }
  }
}

export const speechHandler = new SpeechHandler();

