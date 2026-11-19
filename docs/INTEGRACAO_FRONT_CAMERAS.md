# Integração do front — câmeras e cadastro facial (MC-037)

Guia para quem constrói as telas que comandam o protótipo de reconhecimento
facial. A funcionalidade já existe na API; este documento descreve **como usá-la
no front**. Regras de negócio e limites: `CONTROLE_DE_MUDANCAS.md` (MC-036 e MC-037).

> **Estado (MC-038):** implementado em `src/components/school/FaceRecognitionPanel.tsx`,
> exibido em **Ferramentas** do painel escolar. Origem dos registros: `accessOriginLabel`
> e `MethodChip` em `src/components/school/AccessLogTable.tsx`.

> Protótipo de laboratório. Cadastre só o rosto de adultos voluntários da equipe,
> com consentimento, representando estudantes no teste; nunca o de uma criança.
> As telas não devem sugerir reconhecimento homologado ou catraca física acionada.
>
> **Sequência (MC-039):** a API só grava a direção esperada para o estudante no dia
> (entrada → saída → entrada). Fora dela, `POST /device/recognitions` responde
> `{ decision: 'SEQUENCE_BLOCKED', expectedDirection, lastEvent }` sem gravar nada.

## Onde está cada coisa

| Arquivo | Para quê |
|---|---|
| `src/services/edgeAgentsApi.ts` | Cliente pronto. **Importe daqui**; não chame `fetch` direto. |
| `shared/contracts/edgeAgents.ts` | Tipos de requisição/resposta e estados (`EdgeControlStatus`, `EdgeAgentRun`...). |
| `shared/contracts/accessDevices.ts` | `AccessDeviceRecord` (catraca, direção, `cameraSource`). |
| `src/services/apiError.ts` | `ApiClientError` com `code`, `message` e `status`. |
| `server/modules/edgeAgents/service.ts` | Regras aplicadas pela API (fonte da verdade deste guia). |

## Como funciona (o que a tela precisa comunicar)

- A API roda os scripts Python **no computador do servidor escolar**. A janela de
  vídeo (cadastro ou catraca) abre **nesse computador**, não no navegador.
  Textos sugeridos: "A janela de captura abriu no computador da portaria. Olhe para a câmera."
- Cada catraca (`cat-01-entrada`, `cat-01-saida`) tem uma câmera (`cameraSource`):
  índice de webcam (`"0"`, `"1"`) ou URL do celular (`http://192.168.0.5:4747/video`).
- Uma câmera atende **um processo por vez**: para cadastrar usando a câmera da
  entrada, a catraca de entrada precisa estar parada.
- Passagens liberadas aparecem no feed de acessos já existente
  (`accessEventsApi`); negações, em `accessDevicesApi.listDenials()`. Esta parte
  não muda.

## Disponibilidade

A função só fica ativa quando a API sobe com `npm run dev` (`EDGE_CONTROL_ENABLED=true`).
Na apresentação por QR (`api:device`, `presentation:start`) ela fica **desligada**.

`getStatus()` funciona mesmo desligada. Use-o para decidir o que mostrar:

```ts
const status = await edgeAgentsApi.getStatus();
if (!status.enabled) {
  // Esconder ou desabilitar os botões. Texto: "Comando das câmeras disponível
  // somente no computador da portaria (npm run dev)."
} else if (status.ready.message) {
  // Ambiente incompleto (Python ou modelos ausentes): exibir status.ready.message como está.
}
```

## Permissões por perfil

| Ação | Portaria (`STAFF_GATE`) | Coordenação / Direção | Responsável |
|---|---|---|---|
| Ver estado (`getStatus`) | ✅ | ✅ | ❌ |
| Iniciar / parar catraca | ✅ | ✅ | ❌ |
| Configurar câmera da catraca | ❌ | ✅ | ❌ |
| Cadastrar, cancelar, listar, remover rosto | ❌ | ✅ | ❌ |

A API recusa com `403 FORBIDDEN` de qualquer forma; o front deve **esconder** o que
o perfil não pode fazer, sem depender só do erro.

## Acompanhamento: polling

Não há push. Com a tela aberta, chame `getStatus()` **a cada 2 s enquanto houver
algo em `RUNNING`/`STOPPING`** e a cada 5 s no restante (mesmo padrão do painel atual).
Pare o intervalo ao sair da tela.

```ts
interface EdgeControlStatus {
  enabled: boolean;
  ready: { python: boolean; models: boolean; message?: string };
  cameras: Array<{ device: AccessDeviceRecord; recognition?: EdgeAgentRun }>;
  enrollment?: EdgeAgentRun; // último cadastro (em andamento ou encerrado)
}

interface EdgeAgentRun {
  id: string;            // muda a cada execução; use para detectar uma nova
  kind: 'RECOGNITION' | 'ENROLLMENT';
  deviceId: string;
  studentId?: string;    // só no cadastro
  state: 'RUNNING' | 'STOPPING' | 'STOPPED' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  endedAt?: string;
  exitCode?: number | null;
  startedBy: string;     // id do usuário
  log: string[];         // últimas linhas do agente (até 40)
}
```

`recognition`/`enrollment` ausentes = nunca iniciados desde que a API subiu
(o histórico fica só em memória; reiniciar a API limpa).

### Estados → interface

| `state` | Significado | Botão / indicador |
|---|---|---|
| ausente | nunca iniciado | **Iniciar** |
| `RUNNING` | processo ativo | **Parar**; indicador "Em execução" |
| `STOPPING` | parada pedida, liberando câmera (até ~6 s) | "Parando…", botão desabilitado |
| `STOPPED` | parado pelo painel ou tecla `q` na janela | **Iniciar** |
| `COMPLETED` | só cadastro: amostras capturadas | "Cadastro concluído"; atualizar lista de cadastros |
| `FAILED` | erro (câmera, token, ambiente) | **Iniciar** + mensagem (ver abaixo) |

Mensagem de falha: use a última linha de `log` que não comece com `[ WARN` (avisos
do OpenCV). Exemplo de linha útil: `Não foi possível abrir a câmera 'http://…'.
Confira CAMERA_SOURCE…`. O `log` pode ser exibido inteiro num "Ver detalhes"
para diagnóstico; ele nunca contém imagem ou vetor facial.

Cadastro cancelado pelo usuário com `q` na janela também termina em `FAILED`
(saída 1, linha "Cadastro cancelado."). Trate essa linha como cancelamento, não erro.

## Fluxos de tela

### 1. Configurar câmera da catraca (Coordenação/Direção)

```ts
await edgeAgentsApi.setCameraSource('cat-01-saida', 'http://192.168.0.8:4747/video');
```

- Campo de texto com exemplos: `0` (webcam), `http://IP-DO-CELULAR:4747/video` (DroidCam),
  `http://IP-DO-CELULAR:8080/video` (IP Webcam).
- Aceita índice `0`–`99` ou URL `http`, `https`, `rtsp`. **Recusa usuário/senha na
  URL** (`422`). Mostrar `error.message`.
- Se a catraca estiver rodando, a nova câmera vale **no próximo início**: avise ou
  ofereça "Reiniciar agora" (parar → aguardar `STOPPED` → iniciar).

### 2. Iniciar / parar catraca de entrada ou saída

```ts
await edgeAgentsApi.startRecognition('cat-01-entrada');   // resposta: EdgeAgentRun (RUNNING)
await edgeAgentsApi.stopRecognition('cat-01-entrada');    // resposta: EdgeAgentRun (STOPPING)
```

- Desabilite "Iniciar" se `device.cameraSource` estiver vazio (mostrar "Defina a câmera")
  ou `device.active === false`.
- Entrada e saída podem rodar ao mesmo tempo (câmeras diferentes).
- Depois de iniciar, a catraca leva alguns segundos para abrir o vídeo. Se a câmera
  não responder, o estado vira `FAILED` em até ~15–30 s; o polling mostra.
- Cada início renova o token da catraca. Consequência para o usuário: um agente
  aberto manualmente por terminal para essa catraca deixa de ser aceito. Não é
  preciso expor isso na tela, mas não ofereça "copiar token".

### 3. Cadastro facial (Coordenação/Direção)

```ts
await edgeAgentsApi.startEnrollment({
  studentId: 'std-1',
  deviceId: 'cat-01-entrada', // câmera usada na captura
  consent: true,
  samples: 8,                 // opcional, 3 a 20
});
// Acompanhar status.enrollment até COMPLETED / FAILED / STOPPED.
await edgeAgentsApi.cancelEnrollment(); // botão "Cancelar" enquanto RUNNING
```

Tela sugerida:

1. Seletor de estudante e seletor da câmera (catracas com `cameraSource`).
2. **Caixa de consentimento obrigatória**, desmarcada por padrão, com o texto:
   "Confirmo que a pessoa cadastrada é adulta da equipe, consentiu com o teste e
   não é uma criança." O botão "Iniciar cadastro" só habilita
   marcada. Sem ela a API devolve `422`.
3. Se a câmera escolhida estiver em uso por uma catraca (`recognition.state === 'RUNNING'`),
   avise antes e ofereça "Parar catraca e cadastrar" (parar → aguardar `STOPPED` → iniciar cadastro).
4. Durante `RUNNING`: "Olhe para a câmera e varie levemente o ângulo. A janela abriu
   no computador da portaria." + botão **Cancelar**.
5. Em `COMPLETED`: recarregar `listEnrollments()`. Catracas em execução passam a
   reconhecer o novo rosto em até ~2 s, sem reiniciar.
6. Cadastrar de novo o mesmo estudante **substitui** as amostras anteriores.

O nome mostrado na janela da catraca é o nome do estudante na base; o front não
envia rótulo.

### 4. Lista e remoção de cadastros (Coordenação/Direção)

```ts
const people = await edgeAgentsApi.listEnrollments();
// [{ studentId: 'std-1', studentName: 'Ana Clara de Souza Mendes', label: '...', samples: 8 }]
await edgeAgentsApi.removeEnrollment('std-1');
```

- `studentName` pode faltar (vetor de estudante que não existe mais na base): exiba `studentId`.
- Remoção pede confirmação ("Os vetores faciais deste estudante serão apagados deste computador").
- Não é possível remover enquanto o cadastro **do mesmo estudante** está em andamento (`409`).
- `listEnrollments` e `removeEnrollment` executam Python e levam ~1–3 s: mostrar carregamento.

## Erros

Todos chegam como `ApiClientError` (`code`, `message`, `status`). As mensagens da
API já estão em português e podem ser exibidas diretamente; use `code` para decidir
a ação da tela.

| `code` | HTTP | Quando | Ação sugerida |
|---|---|---|---|
| `EDGE_CONTROL_DISABLED` | 503 | API fora do modo local | Esconder/desabilitar comandos |
| `EDGE_NOT_READY` | 503 | Falta `.venv` ou modelos | Exibir `message` (diz o comando) |
| `CAMERA_NOT_CONFIGURED` | 409 | Catraca sem câmera | Abrir configuração da câmera |
| `CAMERA_IN_USE` | 409 | Câmera usada por outra catraca/cadastro | Oferecer parar o que está usando |
| `AGENT_ALREADY_RUNNING` | 409 | Catraca já iniciada | Atualizar status (outro usuário iniciou) |
| `ENROLLMENT_RUNNING` | 409 | Já há cadastro em andamento | Mostrar o cadastro atual |
| `DEVICE_INACTIVE` | 409 | Catraca desativada | Desabilitar botão |
| `VALIDATION_ERROR` | 422 | Sem consentimento, URL inválida, `samples` fora de 3–20 | Exibir `message` junto ao campo |
| `NOT_FOUND` | 404 | Catraca/estudante inexistente, ou parar algo não iniciado pelo painel | Atualizar status |
| `FORBIDDEN` | 403 | Perfil sem permissão | Não deveria ocorrer se a tela esconder a ação |
| `EDGE_AGENT_ERROR` | 502 | Falha ao listar/remover cadastro no Python | Exibir `message`, permitir tentar de novo |
| `UNAUTHORIZED` | 401 | Sessão expirada | Já tratado pelo `authApi` (volta ao login) |
| `API_UNAVAILABLE` | 0 | API fora do ar | Mensagem de conexão; manter polling |

## Referência das rotas

Todas sob `/api/v1`, com sessão (`Authorization: Bearer`). Respostas em `{ data }`;
erros em `{ error: { code, message } }`.

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/edge-agents` | — | `EdgeControlStatus` |
| POST | `/edge-agents/recognition/:deviceId/start` | — | `201` `EdgeAgentRun` |
| POST | `/edge-agents/recognition/:deviceId/stop` | — | `EdgeAgentRun` |
| PATCH | `/access-devices/:deviceId/camera` | `{ cameraSource }` | `AccessDeviceRecord` |
| GET | `/face-enrollments` | — | `FaceEnrollmentRecord[]` |
| POST | `/face-enrollments` | `StartFaceEnrollmentRequest` | `201` `EdgeAgentRun` |
| POST | `/face-enrollments/current/cancel` | — | `EdgeAgentRun` |
| DELETE | `/face-enrollments/:studentId` | — | `{ studentId, removed: true }` |

## Checklist de integração

- [ ] Telas importam `edgeAgentsApi`; nenhum `fetch` direto.
- [ ] `enabled: false` e `ready.message` tratados.
- [ ] Ações escondidas conforme perfil.
- [ ] Polling iniciado/parado com a tela; intervalo menor durante `RUNNING`/`STOPPING`.
- [ ] Todos os estados da tabela representados, inclusive `STOPPING` e `FAILED`.
- [ ] Caixa de consentimento obrigatória no cadastro.
- [ ] Aviso de que a janela de vídeo abre no computador da portaria.
- [ ] Conflito de câmera tratado (parar → aguardar `STOPPED` → iniciar).
- [ ] Texto da tela identifica o recurso como **protótipo de laboratório**.
- [ ] Paleta azul-marinho e laranja preservada.
- [ ] `npm run lint` e `npm run build` passando; fluxo testado com as duas câmeras.
