"""Baixa os modelos YuNet (detecção) e SFace (reconhecimento) do OpenCV Zoo."""
from __future__ import annotations

import sys
import urllib.request

from config import DETECTOR_MODEL, MODELS_DIR, RECOGNIZER_MODEL

BASE = "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models"
MODELS = {
    DETECTOR_MODEL: f"{BASE}/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    RECOGNIZER_MODEL: f"{BASE}/face_recognition_sface/face_recognition_sface_2021dec.onnx",
}
# Arquivos menores que isto são ponteiros Git LFS, não o modelo.
MIN_BYTES = 100_000


def main() -> int:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    for target, url in MODELS.items():
        if target.exists() and target.stat().st_size > MIN_BYTES:
            print(f"OK (já existe): {target.name}")
            continue
        print(f"Baixando {target.name}...")
        temporary = target.with_suffix(".part")
        urllib.request.urlretrieve(url, temporary)
        if temporary.stat().st_size < MIN_BYTES:
            temporary.unlink()
            print(f"Falha: {target.name} veio incompleto. Baixe manualmente de {url}")
            return 1
        temporary.replace(target)
        print(f"OK: {target.name} ({target.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
