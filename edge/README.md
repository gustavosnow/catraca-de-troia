# Agente da catraca — protótipo facial (MC-036)

Protótipo de laboratório: a câmera (webcam ou celular) identifica o rosto com
Python/OpenCV e a API local decide se libera ou nega. **Não é homologação**, não
aciona catraca física e não tem prova de vida.

```
Câmera/celular ──► recognize.py (detecta, compara, confirma em 3 quadros)
                        │  envia só: studentId candidato, similaridade, tempo
                        ▼
                  API local ──► autoriza ou nega ──► painel + portal dos responsáveis
```

## Regras de uso dos dados

- Cadastre **apenas adultos da equipe, com consentimento**, ligados a estudantes
  **fictícios** da base demonstrativa (`std-1`, `std-2`...). Nunca crianças ou estudantes reais.
- Nenhuma foto é salva. Ficam só vetores em `edge/data/gallery.npz`, fora do Git.
- Para apagar: `python enroll.py --remove std-1`, ou apague a pasta `edge/data/`.
- Negações não guardam imagem, vetor nem identidade.

## Preparação (uma vez)

1. **API e painel** (na raiz do projeto): `npm run dev`.
2. **Cadastrar a catraca** (na raiz, em outro terminal):
   ```bash
   npm run device:register -- --id cat-01-entrada --direction ENTRY
   ```
   Copie o token exibido. Para uma câmera de saída, use outro `--id` com `--direction EXIT`.
3. **Ambiente Python** (dentro de `edge/`):
   ```bash
   python -m venv .venv
   .venv\Scripts\activate          # Windows (no Git Bash: source .venv/Scripts/activate)
   pip install -r requirements.txt
   python download_models.py
   copy .env.example .env          # e preencha DEVICE_TOKEN e CAMERA_SOURCE
   ```

## Usar o celular como câmera

| App | `CAMERA_SOURCE` |
|---|---|
| DroidCam (iPhone/Android), pela rede | `http://IP-DO-CELULAR:4747/video` |
| IP Webcam (Android) | `http://IP-DO-CELULAR:8080/video` |
| DroidCam/iVCam com cliente Windows (vira webcam) | `1` (ou `2`; `0` costuma ser a webcam do notebook) |

Antes, abra o endereço no navegador do PC. Se o vídeo aparecer, o agente também vai abrir.
Celular e PC precisam estar na mesma rede, que deve permitir comunicação entre aparelhos.

## Cadastro e reconhecimento

```bash
python enroll.py --student std-1 --label "Integrante A" --consenti
python enroll.py --list
python recognize.py
```

Na tela da catraca: verde **LIBERADO** registra a passagem (aparece no painel e no
portal do responsável de `std-1`); vermelho **NEGADO** registra só a tentativa.
Leituras feitas com a API fora do ar ficam pendentes e são reenviadas com o mesmo
identificador, sem duplicar.

## Calibrar o limiar

`MATCH_THRESHOLD` (agente) e `--min-score` (catraca na API) definem a similaridade
mínima. O valor da API prevalece: o agente pode ser mais exigente, nunca menos.

1. Cada integrante passa algumas vezes. Anote as similaridades exibidas.
2. Passe alguém **não** cadastrado e anote também.
3. Escolha um limiar entre os dois grupos, mais perto do grupo cadastrado: na
   escola, liberar a pessoa errada é pior que negar a certa.

`edge/data/metrics.csv` registra decisão, similaridade e tempo de inferência de cada
tentativa. Esses números medem o protótipo com poucos rostos e não comprovam as
metas de homologação (≥ 95% de acurácia, ≤ 500 ms).
