"""Cadastro facial do protótipo (MC-036).

Use SOMENTE rostos de adultos da equipe, com consentimento, ligados a
estudantes fictícios da base demonstrativa. Nenhuma foto é salva; apenas
vetores em edge/data/gallery.npz (fora do Git).

  python enroll.py --list
  python enroll.py --student std-1 --label "Integrante A" --consenti
  python enroll.py --remove std-1
"""
from __future__ import annotations

import argparse
import sys
import time

import cv2

from config import load_settings
from faces import FaceEngine, Gallery, open_camera

WINDOW = "Cadastro facial - prototipo (q para sair)"


def capture_samples(engine: FaceEngine, source: int | str, samples: int) -> list:
    capture = open_camera(source)
    collected: list = []
    last_capture = 0.0
    message = "Olhe para a camera. Varie levemente o angulo."
    try:
        while len(collected) < samples:
            ok, frame = capture.read()
            if not ok:
                message = "Sem imagem da camera..."
                time.sleep(0.1)
                continue
            frame = engine.prepare(frame)
            detection = engine.detect_largest(frame)
            color = (0, 0, 255)
            if detection is not None:
                x, y, w, h = detection.box
                big_enough = w >= 90
                if big_enough and detection.score >= 0.9 and time.time() - last_capture > 0.6:
                    collected.append(engine.embed(frame, detection))
                    last_capture = time.time()
                color = (0, 200, 0) if big_enough else (0, 165, 255)
                if not big_enough:
                    message = "Aproxime-se da camera."
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            preview = frame.copy()
            cv2.putText(preview, f"Amostras: {len(collected)}/{samples}", (10, 28),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(preview, message, (10, preview.shape[0] - 14),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
            cv2.imshow(WINDOW, preview)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                return []
    finally:
        capture.release()
        cv2.destroyAllWindows()
    return collected


def main() -> int:
    parser = argparse.ArgumentParser(description="Cadastro facial do protótipo da Catraca de Troia.")
    parser.add_argument("--student", help="studentId da base demonstrativa (ex.: std-1)")
    parser.add_argument("--label", help="Nome exibido na tela da catraca")
    parser.add_argument("--samples", type=int, default=8)
    parser.add_argument("--consenti", action="store_true",
                        help="Confirma que a pessoa é adulta da equipe e consentiu com o teste")
    parser.add_argument("--remove", metavar="STUDENT_ID", help="Apaga os vetores desse studentId")
    parser.add_argument("--list", action="store_true", help="Lista quem está cadastrado")
    args = parser.parse_args()

    gallery = Gallery.load()

    if args.list:
        people = gallery.people()
        if not people:
            print("Nenhum rosto cadastrado.")
        for sid, (label, count) in people.items():
            print(f"{sid}: {label} ({count} amostras)")
        return 0

    if args.remove:
        removed = gallery.remove(args.remove)
        gallery.save()
        print(f"{removed} amostra(s) de {args.remove} apagada(s).")
        return 0

    if not args.student or not args.label:
        parser.error("informe --student e --label (ou use --list / --remove).")
    if not args.consenti:
        print("Cadastro bloqueado: use --consenti para confirmar que a pessoa é adulta da equipe,")
        print("consentiu com o teste e está ligada a um estudante FICTÍCIO. Não cadastre crianças")
        print("nem estudantes reais sem a governança institucional prevista no projeto.")
        return 1

    settings = load_settings()
    engine = FaceEngine(settings.process_width)
    samples = capture_samples(engine, settings.camera_source, max(3, args.samples))
    if not samples:
        print("Cadastro cancelado.")
        return 1
    gallery.add(args.student, args.label, samples)
    gallery.save()
    print(f"{args.label} cadastrado(a) como {args.student} com {len(samples)} amostras.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
