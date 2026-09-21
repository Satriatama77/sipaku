from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.services import nlp_service
from app.schemas.katalog_schema import KatalogUpdate

router = APIRouter(prefix="/api/nlp", tags=["NLP Voice Input"])

@router.post("/voice-to-text")
async def voice_to_text(audio: UploadFile = File(...)):
    """
    Endpoint untuk menerima audio blob dari browser (WebM/OGG)
    dan mengembalikan teks + data harga yang diparsing.
    """
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="File audio kosong")

    # Step 1: Transkripsi audio → teks
    transkrip = await nlp_service.transkripsi_audio(audio_bytes, filename=audio.filename)

    # Step 2: Parse teks → data harga terstruktur
    hasil_parse = nlp_service.parse_voice_input(transkrip)

    return {
        "status": "sukses",
        "transkrip": transkrip,
        "hasil_parse": hasil_parse,
    }

@router.post("/text-parse")
def parse_text(teks: str):
    """
    Endpoint debug: kirim teks manual untuk diuji parsing NLP-nya
    tanpa perlu upload audio (berguna saat development).
    """
    hasil = nlp_service.parse_voice_input(teks)
    return {"status": "sukses", "hasil_parse": hasil}
