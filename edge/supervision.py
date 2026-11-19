"""Encerramento coordenado quando o agente é iniciado pela API local (MC-037).

Com EDGE_SUPERVISED=1, a API mantém aberta a entrada padrão do processo.
Quando a API fecha essa entrada (botão "parar") ou o próprio servidor cai,
o agente percebe o fim da entrada, encerra o laço principal e libera a câmera.
Se o laço não terminar a tempo (câmera de rede travada), o processo sai à força.
"""
from __future__ import annotations

import os
import sys
import threading

_stop = threading.Event()
FORCED_EXIT_SECONDS = 5.0


def _watch_stdin() -> None:
    # os.read no descritor, e não sys.stdin.buffer: o leitor com buffer segura uma
    # trava que derruba o interpretador ao encerrar com esta thread bloqueada.
    try:
        descriptor = sys.stdin.fileno()
        while os.read(descriptor, 1024):
            pass
    except (OSError, ValueError):
        pass
    _stop.set()
    timer = threading.Timer(FORCED_EXIT_SECONDS, lambda: os._exit(0))
    timer.daemon = True
    timer.start()


def start() -> None:
    """Ativa a supervisão somente quando o agente foi iniciado pela API."""
    if os.environ.get("EDGE_SUPERVISED") != "1":
        return
    threading.Thread(target=_watch_stdin, name="edge-supervision", daemon=True).start()


def should_stop() -> bool:
    return _stop.is_set()
