"""Detecção (YuNet), vetor facial (SFace) e comparação com a galeria local.

Nenhuma imagem é gravada: a galeria guarda apenas vetores de 128 números por
amostra, ligados a um studentId fictício. Ver MC-036.
"""
from __future__ import annotations

import time
from dataclasses import dataclass

import cv2
import numpy as np

from config import DETECTOR_MODEL, GALLERY_PATH, RECOGNIZER_MODEL


@dataclass
class Detection:
    box: tuple[int, int, int, int]  # x, y, largura, altura (no quadro processado)
    score: float
    raw: np.ndarray  # linha completa do YuNet (caixa + 5 pontos + score)


@dataclass
class Identification:
    detection: Detection | None
    student_id: str | None  # melhor candidato, mesmo abaixo do limiar
    label: str | None
    score: float
    inference_ms: float


def _normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=-1, keepdims=True)
    return vectors / np.clip(norms, 1e-9, None)


class Gallery:
    """Vetores cadastrados. Cada estudante pode ter várias amostras."""

    def __init__(self) -> None:
        self.student_ids: list[str] = []
        self.labels: list[str] = []
        self.embeddings = np.zeros((0, 128), dtype=np.float32)

    @classmethod
    def load(cls) -> "Gallery":
        gallery = cls()
        if GALLERY_PATH.exists():
            data = np.load(GALLERY_PATH, allow_pickle=False)
            gallery.student_ids = [str(item) for item in data["student_ids"]]
            gallery.labels = [str(item) for item in data["labels"]]
            gallery.embeddings = data["embeddings"].astype(np.float32)
        return gallery

    def save(self) -> None:
        GALLERY_PATH.parent.mkdir(parents=True, exist_ok=True)
        np.savez(
            GALLERY_PATH,
            student_ids=np.array(self.student_ids),
            labels=np.array(self.labels),
            embeddings=self.embeddings,
        )

    def add(self, student_id: str, label: str, embeddings: list[np.ndarray]) -> None:
        self.remove(student_id)
        for embedding in embeddings:
            self.student_ids.append(student_id)
            self.labels.append(label)
        self.embeddings = np.vstack([self.embeddings, *[e.reshape(1, -1) for e in embeddings]])

    def remove(self, student_id: str) -> int:
        keep = [index for index, sid in enumerate(self.student_ids) if sid != student_id]
        removed = len(self.student_ids) - len(keep)
        self.student_ids = [self.student_ids[i] for i in keep]
        self.labels = [self.labels[i] for i in keep]
        self.embeddings = self.embeddings[keep] if keep else np.zeros((0, 128), dtype=np.float32)
        return removed

    def people(self) -> dict[str, tuple[str, int]]:
        summary: dict[str, tuple[str, int]] = {}
        for sid, label in zip(self.student_ids, self.labels):
            summary[sid] = (label, summary.get(sid, (label, 0))[1] + 1)
        return summary

    def centroids(self) -> tuple[list[str], list[str], np.ndarray]:
        """Média normalizada das amostras de cada estudante."""
        ids = sorted(set(self.student_ids))
        if not ids:
            return [], [], np.zeros((0, 128), dtype=np.float32)
        normalized = _normalize(self.embeddings)
        vectors, labels = [], []
        for sid in ids:
            indexes = [i for i, candidate in enumerate(self.student_ids) if candidate == sid]
            vectors.append(normalized[indexes].mean(axis=0))
            labels.append(self.labels[indexes[0]])
        return ids, labels, _normalize(np.vstack(vectors))


class FaceEngine:
    def __init__(self, process_width: int = 640) -> None:
        for model in (DETECTOR_MODEL, RECOGNIZER_MODEL):
            if not model.exists():
                raise SystemExit(f"Modelo ausente: {model.name}. Rode: python download_models.py")
        self.process_width = process_width
        self.detector = cv2.FaceDetectorYN.create(str(DETECTOR_MODEL), "", (320, 320), 0.85, 0.3, 50)
        self.recognizer = cv2.FaceRecognizerSF.create(str(RECOGNIZER_MODEL), "")
        self._ids: list[str] = []
        self._labels: list[str] = []
        self._centroids = np.zeros((0, 128), dtype=np.float32)

    def use_gallery(self, gallery: Gallery) -> None:
        self._ids, self._labels, self._centroids = gallery.centroids()

    def prepare(self, frame: np.ndarray) -> np.ndarray:
        height, width = frame.shape[:2]
        if width <= self.process_width:
            return frame
        scale = self.process_width / width
        return cv2.resize(frame, (self.process_width, int(height * scale)))

    def detect_largest(self, frame: np.ndarray) -> Detection | None:
        height, width = frame.shape[:2]
        self.detector.setInputSize((width, height))
        _, faces = self.detector.detect(frame)
        if faces is None or len(faces) == 0:
            return None
        best = max(faces, key=lambda face: face[2] * face[3])
        x, y, w, h = (int(v) for v in best[:4])
        return Detection(box=(x, y, w, h), score=float(best[14]), raw=best)

    def embed(self, frame: np.ndarray, detection: Detection) -> np.ndarray:
        aligned = self.recognizer.alignCrop(frame, detection.raw)
        feature = self.recognizer.feature(aligned)
        return _normalize(feature.reshape(-1).astype(np.float32))

    def identify(self, frame: np.ndarray) -> Identification:
        """Detecta o maior rosto e compara com a galeria. `frame` já preparado."""
        started = time.perf_counter()
        detection = self.detect_largest(frame)
        if detection is None:
            return Identification(None, None, None, 0.0, (time.perf_counter() - started) * 1000)
        vector = self.embed(frame, detection)
        if len(self._ids) == 0:
            return Identification(detection, None, None, 0.0, (time.perf_counter() - started) * 1000)
        scores = self._centroids @ vector
        best = int(np.argmax(scores))
        elapsed = (time.perf_counter() - started) * 1000
        return Identification(detection, self._ids[best], self._labels[best], float(scores[best]), elapsed)


def open_camera(source: int | str) -> cv2.VideoCapture:
    capture = cv2.VideoCapture(source)
    if isinstance(source, str):
        # Reduz o atraso de streams pela rede.
        capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    if not capture.isOpened():
        raise SystemExit(
            f"Não foi possível abrir a câmera '{source}'. Confira CAMERA_SOURCE em edge/.env e "
            "se o celular está na mesma rede. O DroidCam aceita só UMA conexão: feche a aba do "
            "navegador ou o cliente DroidCam que estiver mostrando o vídeo e tente de novo."
        )
    return capture
