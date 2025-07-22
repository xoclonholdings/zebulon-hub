// Enhanced Voice Activation with Advanced Security Features
import { toast } from "@/hooks/use-toast";

export interface VoiceProfile {
  id: string;
  userId: number;
  voicePrint: Float32Array;
  name: string;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
  createdAt: Date;
  lastUsed: Date;
}

export interface VoiceCommand {
  command: string;
  confidence: number;
  authenticated: boolean;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
  timestamp: Date;
}

export interface VoiceSettings {
  enabled: boolean;
  wakeWord: string;
  securityLevel: 'basic' | 'enhanced' | 'maximum';
  requireAuthentication: boolean;
  commandTimeout: number;
  noiseThreshold: number;
  voiceMatchThreshold: number;
}

class VoiceActivationService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isListening: boolean = false;
  private isAuthenticated: boolean = false;
  private currentVoiceProfile: VoiceProfile | null = null;
  private settings: VoiceSettings;
  private wakeWordDetected: boolean = false;
  private lastCommandTime: number = 0;
  private securityEvents: string[] = [];

  constructor() {
    this.settings = {
      enabled: true,
      wakeWord: 'zebulon',
      securityLevel: 'enhanced',
      requireAuthentication: true,
      commandTimeout: 10000, // 10 seconds
      noiseThreshold: 0.1,
      voiceMatchThreshold: 0.85
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Voice Security: getUserMedia not supported in this browser');
        return false;
      }

      // Request microphone permissions with graceful fallback
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      // Initialize media recorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.setupEventListeners();
      this.logSecurityEvent('Voice activation system initialized');
      return true;
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          console.warn('Voice Security: Microphone access denied by user');
          this.logSecurityEvent('Microphone access denied - voice features disabled');
        } else if (error.name === 'NotFoundError') {
          console.warn('Voice Security: No microphone found');
          this.logSecurityEvent('No microphone detected - voice features disabled');
        } else {
          console.warn('Voice Security: Browser compatibility issue:', error.message);
          this.logSecurityEvent(`Browser compatibility: ${error.message}`);
        }
      } else {
        console.error('Voice Security: Unexpected error:', error);
        this.logSecurityEvent(`Initialization failed: ${error}`);
      }
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        await this.processAudioData(event.data);
      }
    };

    this.mediaRecorder.onerror = (error) => {
      console.error('MediaRecorder error:', error);
      this.logSecurityEvent(`Recording error: ${error}`);
    };
  }

  async startListening(): Promise<void> {
    if (!this.mediaRecorder || this.isListening) return;

    try {
      this.isListening = true;
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.startWakeWordDetection();
      this.logSecurityEvent('Voice listening started');
      
      toast({
        title: "Voice Activation",
        description: `Listening for wake word: "${this.settings.wakeWord}"`,
        duration: 2000,
      });
    } catch (error) {
      this.isListening = false;
      this.logSecurityEvent(`Failed to start listening: ${error}`);
      throw error;
    }
  }

  stopListening(): void {
    if (this.mediaRecorder && this.isListening) {
      this.mediaRecorder.stop();
      this.isListening = false;
      this.wakeWordDetected = false;
      this.logSecurityEvent('Voice listening stopped');
    }
  }

  private startWakeWordDetection(): void {
    if (!this.analyser) return;

    const detectWakeWord = () => {
      if (!this.isListening) return;

      const dataArray = new Uint8Array(this.analyser!.frequencyBinCount);
      this.analyser!.getByteFrequencyData(dataArray);

      // Simple volume-based wake word detection (can be enhanced with ML)
      const volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      
      if (volume > this.settings.noiseThreshold * 255 && !this.wakeWordDetected) {
        this.onWakeWordDetected();
      }

      requestAnimationFrame(detectWakeWord);
    };

    detectWakeWord();
  }

  private async onWakeWordDetected(): Promise<void> {
    this.wakeWordDetected = true;
    this.lastCommandTime = Date.now();
    this.logSecurityEvent('Wake word detected');

    toast({
      title: "Voice Activated",
      description: "Listening for command...",
      duration: 3000,
    });

    // Start command timeout
    setTimeout(() => {
      if (this.wakeWordDetected && Date.now() - this.lastCommandTime > this.settings.commandTimeout) {
        this.wakeWordDetected = false;
        this.logSecurityEvent('Command timeout');
        toast({
          title: "Voice Timeout",
          description: "No command received, returning to wake word detection",
          variant: "destructive",
        });
      }
    }, this.settings.commandTimeout);
  }

  private async processAudioData(audioBlob: Blob): Promise<void> {
    if (!this.wakeWordDetected) return;

    try {
      // Convert audio to text (simplified - would use speech recognition API)
      const command = await this.speechToText(audioBlob);
      
      if (command) {
        const voiceCommand: VoiceCommand = {
          command,
          confidence: 0.9, // Would be from actual speech recognition
          authenticated: await this.authenticateVoice(audioBlob),
          securityLevel: this.settings.securityLevel,
          timestamp: new Date()
        };

        await this.processVoiceCommand(voiceCommand);
      }
    } catch (error) {
      this.logSecurityEvent(`Audio processing error: ${error}`);
    }
  }

  private async speechToText(audioBlob: Blob): Promise<string | null> {
    // Simplified speech-to-text (would integrate with browser SpeechRecognition API)
    return new Promise((resolve) => {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        resolve(transcript);
      };

      recognition.onerror = () => resolve(null);
      recognition.onend = () => resolve(null);

      // Convert blob to audio for recognition
      const audio = new Audio(URL.createObjectURL(audioBlob));
      recognition.start();
    });
  }

  private async authenticateVoice(audioBlob: Blob): Promise<boolean> {
    if (!this.settings.requireAuthentication) return true;
    if (!this.currentVoiceProfile) return false;

    try {
      // Extract voice features (simplified)
      const voiceFeatures = await this.extractVoiceFeatures(audioBlob);
      const similarity = this.compareVoiceProfiles(voiceFeatures, this.currentVoiceProfile.voicePrint);
      
      const authenticated = similarity >= this.settings.voiceMatchThreshold;
      
      if (authenticated) {
        this.isAuthenticated = true;
        this.logSecurityEvent(`Voice authentication successful (${similarity.toFixed(3)})`);
      } else {
        this.logSecurityEvent(`Voice authentication failed (${similarity.toFixed(3)})`);
        toast({
          title: "Authentication Failed",
          description: "Voice pattern does not match registered user",
          variant: "destructive",
        });
      }

      return authenticated;
    } catch (error) {
      this.logSecurityEvent(`Voice authentication error: ${error}`);
      return false;
    }
  }

  private async extractVoiceFeatures(audioBlob: Blob): Promise<Float32Array> {
    // Simplified voice feature extraction (would use advanced audio analysis)
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioData = new Float32Array(arrayBuffer.byteLength / 4);
    
    // Extract basic features (pitch, formants, etc.)
    // This is a placeholder - real implementation would use MFCC, spectral features, etc.
    for (let i = 0; i < audioData.length; i++) {
      audioData[i] = Math.random(); // Placeholder
    }
    
    return audioData;
  }

  private compareVoiceProfiles(features1: Float32Array, features2: Float32Array): number {
    // Simplified cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const length = Math.min(features1.length, features2.length);
    
    for (let i = 0; i < length; i++) {
      dotProduct += features1[i] * features2[i];
      norm1 += features1[i] * features1[i];
      norm2 += features2[i] * features2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private async processVoiceCommand(voiceCommand: VoiceCommand): Promise<void> {
    this.wakeWordDetected = false;

    if (!voiceCommand.authenticated && this.settings.requireAuthentication) {
      toast({
        title: "Unauthorized Voice Command",
        description: "Voice authentication required for this action",
        variant: "destructive",
      });
      return;
    }

    this.logSecurityEvent(`Processing command: "${voiceCommand.command}" (auth: ${voiceCommand.authenticated})`);

    // Broadcast voice command to main application
    window.dispatchEvent(new CustomEvent('voiceCommand', {
      detail: voiceCommand
    }));

    toast({
      title: "Voice Command Received",
      description: `"${voiceCommand.command}"`,
    });
  }

  async createVoiceProfile(userId: number, name: string): Promise<VoiceProfile> {
    toast({
      title: "Creating Voice Profile",
      description: "Please speak clearly for 5 seconds...",
    });

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Voice system not initialized'));
        return;
      }

      const audioChunks: Blob[] = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const voicePrint = await this.extractVoiceFeatures(audioBlob);
          
          const profile: VoiceProfile = {
            id: `voice_${Date.now()}`,
            userId,
            voicePrint,
            name,
            securityLevel: this.settings.securityLevel,
            createdAt: new Date(),
            lastUsed: new Date()
          };

          this.currentVoiceProfile = profile;
          this.logSecurityEvent(`Voice profile created for user ${userId}`);
          
          toast({
            title: "Voice Profile Created",
            description: `Profile "${name}" registered successfully`,
          });

          resolve(profile);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.start();
      
      // Record for 5 seconds
      setTimeout(() => {
        if (this.mediaRecorder?.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, 5000);
    });
  }

  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.logSecurityEvent(`Settings updated: ${JSON.stringify(newSettings)}`);
  }

  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  getSecurityEvents(): string[] {
    return [...this.securityEvents];
  }

  clearSecurityEvents(): void {
    this.securityEvents = [];
    this.logSecurityEvent('Security events cleared');
  }

  private logSecurityEvent(event: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${event}`;
    this.securityEvents.push(logEntry);
    
    // Keep only last 100 events
    if (this.securityEvents.length > 100) {
      this.securityEvents.shift();
    }

    // Also log to console for debugging
    console.log('Voice Security:', logEntry);
  }

  isInitialized(): boolean {
    return this.mediaRecorder !== null && this.audioContext !== null;
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  isVoiceAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  getCurrentProfile(): VoiceProfile | null {
    return this.currentVoiceProfile;
  }
}

export const voiceActivationService = new VoiceActivationService();