import { useState, useRef, useCallback } from 'react';
import { VoiceRecognitionResult } from '@/lib/types';

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      // Show Zebulon-specific error message
      if (error instanceof Error && error.name === 'NotAllowedError') {
        alert('Zebulon needs microphone access to process voice commands. Please allow microphone access and try again.');
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        alert('Zebulon could not detect a microphone. Please check your device settings.');
      } else {
        alert('Zebulon voice system encountered an error. Please try again.');
      }
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') {
        reject(new Error('MediaRecorder is not active'));
        return;
      }

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        
        // Stop all tracks
        mediaRecorder.current?.stream.getTracks().forEach(track => {
          track.stop();
        });
        
        setIsRecording(false);
        resolve(audioBlob);
      };

      mediaRecorder.current.stop();
    });
  }, []);

  const processVoiceCommand = useCallback(async (
    audioBlob: Blob, 
    userId: number,
    onResult?: (result: VoiceRecognitionResult) => void
  ) => {
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Audio = btoa(Array.from(uint8Array).map(b => String.fromCharCode(b)).join(''));
      
      // Send to server for processing
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          audioData: base64Audio
        })
      });

      if (!response.ok) {
        throw new Error('Voice processing failed');
      }

      const result: VoiceRecognitionResult = await response.json();
      
      if (onResult) {
        onResult(result);
      }
      
      return result;
    } catch (error) {
      console.error('Voice processing error:', error);
      const errorResult: VoiceRecognitionResult = {
        recognized: false,
        confidence: 0,
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      
      if (onResult) {
        onResult(errorResult);
      }
      
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const recordAndProcess = useCallback(async (
    userId: number,
    onResult?: (result: VoiceRecognitionResult) => void
  ) => {
    try {
      await startRecording();
      
      // Record for 3 seconds or until manually stopped
      setTimeout(async () => {
        if (isRecording) {
          const audioBlob = await stopRecording();
          await processVoiceCommand(audioBlob, userId, onResult);
        }
      }, 3000);
    } catch (error) {
      console.error('Record and process error:', error);
      if (onResult) {
        onResult({
          recognized: false,
          confidence: 0,
          message: `Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
  }, [startRecording, stopRecording, processVoiceCommand, isRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    processVoiceCommand,
    recordAndProcess
  };
}
