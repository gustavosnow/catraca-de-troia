"""Configuração do agente da catraca, lida de edge/.env e do ambiente."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

EDGE_DIR = Path(__file__).resolve().parent
DATA_DIR = EDGE_DIR / "data"
MODELS_DIR = EDGE_DIR / "models"
GALLERY_PATH = DATA_DIR / "gallery.npz"
METRICS_PATH = DATA_DIR / "metrics.csv"
DETECTOR_MODEL = MODELS_DIR / "face_detection_yunet_2023mar.onnx"
RECOGNIZER_MODEL = MODELS_DIR / "face_recognition_sface_2021dec.onnx"


def _load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


@dataclass(frozen=True)
class Settings:
    api_url: str
    device_token: str
    camera_source: int | str
    match_threshold: float
    frames_required: int
    process_width: int


def load_settings() -> Settings:
    _load_dotenv(EDGE_DIR / ".env")
    source = os.environ.get("CAMERA_SOURCE", "0").strip()
    return Settings(
        api_url=os.environ.get("API_URL", "http://127.0.0.1:3001").rstrip("/"),
        device_token=os.environ.get("DEVICE_TOKEN", "").strip(),
        camera_source=int(source) if source.isdigit() else source,
        match_threshold=float(os.environ.get("MATCH_THRESHOLD", "0.45")),
        frames_required=max(1, int(os.environ.get("FRAMES_REQUIRED", "3"))),
        process_width=max(160, int(os.environ.get("PROCESS_WIDTH", "640"))),
    )
