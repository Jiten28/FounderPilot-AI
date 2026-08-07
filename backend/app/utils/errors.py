"""
Shared error envelope. Every non-2xx response from any router must use
raise_api_error() instead of a bare HTTPException, so the frontend always
gets {error, code, message} — never a raw FastAPI default error page.
"""

from fastapi import HTTPException
from typing import Literal

ErrorCode = Literal["VALIDATION_ERROR", "NOT_FOUND", "AI_TIMEOUT", "SERVER_ERROR"]

_STATUS_BY_CODE = {
    "VALIDATION_ERROR": 422,
    "NOT_FOUND": 404,
    "AI_TIMEOUT": 504,
    "SERVER_ERROR": 500,
}


def raise_api_error(code: ErrorCode, message: str):
    raise HTTPException(
        status_code=_STATUS_BY_CODE[code],
        detail={"error": True, "code": code, "message": message},
    )