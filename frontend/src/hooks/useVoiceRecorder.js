import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Hook untuk mengelola perekaman audio dan transkripsi suara via Web Speech API.
 * - isRecording: boolean, apakah sedang merekam
 * - transcript: string hasil transkripsi real-time
 * - finalTranscript: string hasil transkripsi final setelah stop
 * - error: string pesan error jika ada
 * - isSupported: boolean, apakah browser mendukung Speech Recognition
 * - startRecording: fungsi mulai rekam
 * - stopRecording: fungsi hentikan rekam
 * - resetTranscript: fungsi reset transcript
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording]         = useState(false)
  const [transcript, setTranscript]           = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [error, setError]                     = useState(null)
  const [isSupported, setIsSupported]         = useState(false)

  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError('Browser Anda tidak mendukung Speech Recognition. Gunakan Chrome atau Edge terbaru.')
      return
    }

    setError(null)
    setTranscript('')
    setFinalTranscript('')

    const recognition = new SpeechRecognition()
    recognition.lang = 'id-ID'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event) => {
      let interimText = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript + ' '
        } else {
          interimText += result[0].transcript
        }
      }

      if (finalText) {
        setFinalTranscript((prev) => prev + finalText)
      }
      setTranscript(interimText)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setError('Tidak ada suara terdeteksi. Coba lagi.')
      } else if (event.error === 'not-allowed') {
        setError('Akses mikrofon ditolak. Izinkan akses mikrofon di browser.')
      } else if (event.error === 'network') {
        setError('Koneksi internet diperlukan untuk Speech Recognition.')
      } else {
        setError(`Error speech recognition: ${event.error}`)
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      // Gabungkan final transcript yang sudah terkumpul
      setFinalTranscript((prev) => (prev + transcript).trim())
      setTranscript('')
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [transcript])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setFinalTranscript('')
    setError(null)
  }, [])

  return {
    isRecording,
    transcript,
    finalTranscript,
    error,
    isSupported,
    startRecording,
    stopRecording,
    resetTranscript,
  }
}
