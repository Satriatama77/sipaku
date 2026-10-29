from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.services import nlp_service
from app.dependencies import require_penjual_or_admin

router = APIRouter(
    prefix="/api/nlp",
    tags=["NLP Voice Input"],
    dependencies=[Depends(require_penjual_or_admin)]
)


class TeksInput(BaseModel):
    teks: str


@router.post("/text-parse")
def parse_text(body: TeksInput):
    """
    Endpoint utama: terima teks hasil transkripsi dari Web Speech API (browser)
    dan kembalikan data harga terstruktur hasil parsing NLP.

    Contoh request body:
        { "teks": "harga semen gresik lima puluh ribu per zak" }
    """
    if not body.teks or not body.teks.strip():
        raise HTTPException(status_code=400, detail="Teks tidak boleh kosong")

    hasil = nlp_service.parse_voice_input(body.teks.strip())
    return {
        "status": "sukses",
        "transkrip": body.teks.strip(),
        "hasil_parse": hasil,
        "items": hasil.get("items", []),
        "total_terdeteksi": hasil.get("total_terdeteksi", len(hasil.get("items", []))),
    }


@router.post("/voice-to-text")
async def voice_to_text(audio: UploadFile = File(...)):
    """
    Endpoint legacy: menerima audio blob dari browser.
    Saat ini mengembalikan simulasi teks karena Whisper belum dikonfigurasi.
    Gunakan /text-parse dengan Web Speech API untuk hasil nyata.
    """
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="File audio kosong")

    # Simulasi transkripsi (Whisper belum aktif)
    transkrip = await nlp_service.transkripsi_audio(audio_bytes, filename=audio.filename)
    hasil_parse = nlp_service.parse_voice_input(transkrip)

    return {
        "status": "sukses",
        "transkrip": transkrip,
        "hasil_parse": hasil_parse,
        "items": hasil_parse.get("items", []),
        "total_terdeteksi": hasil_parse.get("total_terdeteksi", len(hasil_parse.get("items", []))),
    }
