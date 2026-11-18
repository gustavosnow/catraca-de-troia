"""Agente da catraca do protótipo facial (MC-036).

Lê a câmera, identifica o rosto, confirma o resultado em quadros
consecutivos e envia apenas a decisão para a API local, que autoriza ou nega.
Pressione q para sair.
"""
from __future__ import annotations

import csv
import json
import sys
import time
import urllib.error
import urllib.request
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

import cv2

import supervision
from config import GALLERY_PATH, METRICS_PATH, Settings, load_settings
from faces import FaceEngine, Gallery, Identification, open_camera

WINDOW = "Catraca de Troia - prototipo facial (q para sair)"
RESULT_HOLD_SECONDS = 2.5   # tempo exibindo LIBERADO/NEGADO
UNKNOWN_PAUSE_SECONDS = 4.0  # evita registrar várias negações da mesma pessoa
NO_FACE_RESET_FRAMES = 5
GALLERY_CHECK_SECONDS = 2.0  # recarrega a galeria quando um novo cadastro termina

GREEN, RED, YELLOW, WHITE, NAVY, ORANGE = (
    (60, 180, 75), (40, 40, 220), (0, 200, 255), (255, 255, 255), (44, 25, 11), (12, 88, 234),
)
DENIAL_TEXT = {
    "UNKNOWN_FACE": "Rosto nao cadastrado",
    "LOW_SCORE": "Similaridade baixa",
    "STUDENT_NOT_REGISTERED": "Estudante fora do cadastro",
}


@dataclass
class Streak:
    candidate: str | None = None  # studentId ou "__unknown__"
    scores: list[float] = field(default_factory=list)
    inference: list[float] = field(default_factory=list)
    missing: int = 0

    def push(self, candidate: str, score: float, inference_ms: float) -> None:
        if candidate != self.candidate:
            self.candidate, self.scores, self.inference = candidate, [], []
        self.scores.append(score)
        self.inference.append(inference_ms)
        self.missing = 0

    def reset(self) -> None:
        self.candidate, self.scores, self.inference, self.missing = None, [], [], 0


@dataclass
class Banner:
    text: str
    detail: str
    color: tuple[int, int, int]
    until: float


class ApiClient:
    def __init__(self, settings: Settings) -> None:
        self.url = f"{settings.api_url}/api/v1/device/recognitions"
        self.token = settings.device_token
        self.pending: list[dict] = []  # leituras que falharam; reenviadas com o mesmo captureId

    def send(self, payload: dict) -> dict | None:
        request = urllib.request.Request(
            self.url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "X-Device-Token": self.token},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=3) as response:
                return json.loads(response.read())["data"]
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", "replace")
            if error.code == 401:
                raise SystemExit("Token da catraca recusado. Gere outro com npm run device:register.")
            print(f"API recusou a leitura ({error.code}): {body}")
            return None
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            print(f"API indisponível ({error}); leitura guardada para reenvio.")
            self.pending.append(payload)
            return None

    def flush_pending(self) -> None:
        for payload in list(self.pending):
            self.pending.remove(payload)
            if self.send(payload) is None:
                return  # continua indisponível; send() já recolocou na fila


def record_metric(decision: str, reason: str, score: float, inference_ms: float, frames: int) -> None:
    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    new_file = not METRICS_PATH.exists()
    with METRICS_PATH.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        if new_file:
            writer.writerow(["registrado_em", "decisao", "motivo", "similaridade", "inferencia_ms", "quadros"])
        writer.writerow([
            datetime.now(timezone.utc).isoformat(timespec="seconds"),
            decision, reason, f"{score:.4f}", f"{inference_ms:.1f}", frames,
        ])


def draw(frame, result: Identification, banner: Banner | None, settings: Settings,
         streak: Streak, fps: float, pending: int) -> None:
    if result.detection is not None:
        x, y, w, h = result.detection.box
        known = result.student_id is not None and result.score >= settings.match_threshold
        color = GREEN if known else RED
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
        label = f"{result.label} {result.score:.2f}" if known else f"? {result.score:.2f}"
        cv2.putText(frame, label, (x, max(18, y - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    height, width = frame.shape[:2]
    cv2.rectangle(frame, (0, 0), (width, 30), NAVY, -1)
    status = (f"inferencia {result.inference_ms:.0f} ms | {fps:.0f} fps | "
              f"confirmando {len(streak.scores)}/{settings.frames_required}")
    if pending:
        status += f" | {pending} pendente(s)"
    cv2.putText(frame, status, (8, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, WHITE, 1)

    if banner and time.time() < banner.until:
        cv2.rectangle(frame, (0, height - 70), (width, height), banner.color, -1)
        cv2.putText(frame, banner.text, (12, height - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, WHITE, 2)
        cv2.putText(frame, banner.detail, (12, height - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.55, WHITE, 1)


def decide(api: ApiClient, streak: Streak, settings: Settings) -> Banner:
    unknown = streak.candidate == "__unknown__"
    score = sum(streak.scores) / len(streak.scores)
    inference_ms = max(streak.inference)
    payload = {
        "captureId": f"cap-{uuid.uuid4()}",
        "result": "NO_MATCH" if unknown else "MATCH",
        "matchScore": round(score, 4),
        "inferenceMs": round(inference_ms, 1),
        "framesConfirmed": len(streak.scores),
    }
    if not unknown:
        payload["studentId"] = streak.candidate

    data = api.send(payload)
    now = time.time()
    if data is None:
        record_metric("SEM_RESPOSTA", "API", score, inference_ms, len(streak.scores))
        return Banner("AGUARDE - API indisponivel", "Use a passagem assistida", YELLOW,
                      now + RESULT_HOLD_SECONDS)

    if data["decision"] == "AUTHORIZED":
        event = data["event"]
        record_metric("LIBERADO", "REPETIDO" if data["duplicate"] else "", score, inference_ms, len(streak.scores))
        detail = f"{event['student']['name']} | {score:.2f} | {inference_ms:.0f} ms"
        title = "LIBERADO" + (" (ja registrado)" if data["duplicate"] else "")
        return Banner(title, detail, GREEN, now + RESULT_HOLD_SECONDS)

    reason = data["reason"]
    record_metric("NEGADO", reason, score, inference_ms, len(streak.scores))
    return Banner(f"NEGADO - {DENIAL_TEXT.get(reason, reason)}", "Procure a portaria",
                  RED, now + max(RESULT_HOLD_SECONDS, UNKNOWN_PAUSE_SECONDS))


def gallery_mtime() -> float:
    try:
        return GALLERY_PATH.stat().st_mtime
    except OSError:
        return 0.0


def main() -> int:
    supervision.start()
    settings = load_settings()
    if not settings.device_token:
        print("Defina DEVICE_TOKEN em edge/.env (npm run device:register).")
        return 1
    gallery = Gallery.load()
    loaded_mtime = gallery_mtime()
    if not gallery.student_ids:
        print("Nenhum rosto cadastrado: todas as leituras serão negadas até o primeiro cadastro.")

    engine = FaceEngine(settings.process_width)
    engine.use_gallery(gallery)
    api = ApiClient(settings)
    capture = open_camera(settings.camera_source)
    print(f"Catraca pronta: {len(gallery.people())} pessoa(s) cadastrada(s), limiar {settings.match_threshold}.")

    streak, banner = Streak(), None
    last_flush, last_frame, fps = 0.0, time.time(), 0.0
    last_gallery_check = time.time()
    failures = 0
    try:
        while not supervision.should_stop():
            ok, frame = capture.read()
            if not ok:
                failures += 1
                if failures > 50:
                    print("Câmera parou de responder; reabrindo...")
                    capture.release()
                    time.sleep(1)
                    capture = open_camera(settings.camera_source)
                    failures = 0
                continue
            failures = 0
            frame = engine.prepare(frame)
            now = time.time()
            fps = 0.9 * fps + 0.1 * (1.0 / max(now - last_frame, 1e-3))
            last_frame = now

            if now - last_gallery_check > GALLERY_CHECK_SECONDS:
                last_gallery_check = now
                current_mtime = gallery_mtime()
                if current_mtime != loaded_mtime:
                    loaded_mtime = current_mtime
                    gallery = Gallery.load()
                    engine.use_gallery(gallery)
                    streak.reset()
                    print(f"Galeria recarregada: {len(gallery.people())} pessoa(s) cadastrada(s).")

            if api.pending and now - last_flush > 5:
                api.flush_pending()
                last_flush = now

            result = engine.identify(frame)
            holding = banner is not None and now < banner.until
            if not holding:
                if result.detection is None:
                    streak.missing += 1
                    if streak.missing >= NO_FACE_RESET_FRAMES:
                        streak.reset()
                else:
                    known = result.student_id is not None and result.score >= settings.match_threshold
                    streak.push(result.student_id if known else "__unknown__", result.score, result.inference_ms)
                    if len(streak.scores) >= settings.frames_required:
                        banner = decide(api, streak, settings)
                        streak.reset()

            draw(frame, result, banner, settings, streak, fps, len(api.pending))
            cv2.imshow(WINDOW, frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        capture.release()
        cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    sys.exit(main())
