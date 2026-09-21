import { useState, useRef, useCallback } from 'react'

/**
 * Hook untuk mengelola perekaman audio via MediaRecorder API browser.
 * Mengembalikan state dan fungsi kontrol mic.
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob]     = useState(null)
  const [error, setError]             = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      setError('Akses mikrofon ditolak atau tidak tersedia.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  return { isRecording, audioBlob, error, startRecording, stopRecording }
}
