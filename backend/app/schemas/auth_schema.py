from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str
    expected_role: Optional[str] = None

class RegisterRequest(BaseModel):
    nama_lengkap: str
    username: str
    password: str

class LoginResponse(BaseModel):
    status: str
    pesan: str
    access_token: Optional[str] = None
    token_type: str = "bearer"
    role: Optional[str] = None
    nama_lengkap: Optional[str] = None
    id_toko: Optional[int] = None
