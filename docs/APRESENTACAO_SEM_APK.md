# Apresentação pelo navegador e QR Code

O objetivo do produto continua sendo um aplicativo Android (APK) para responsáveis. Na apresentação acadêmica, a mesma interface será acessada pelo navegador do celular, sem baixar APK, instalar PWA ou alterar configurações de segurança. A PWA e a adição à tela inicial são opcionais.

## Preparar o computador

1. Atualize o projeto e instale as dependências com `npm ci`.
2. Execute `npm run presentation:start`. O comando compila a interface, inicia a API local e serve o portal na porta 3000. Mantenha o terminal aberto.
3. Escolha uma das formas de acesso abaixo. Um endereço `localhost` só funciona no próprio computador e não deve ser compartilhado com o público.

## Celulares na mesma rede Wi-Fi

Entre com uma conta escolar demonstrativa e abra **Ferramentas → Apresentar portal por QR Code**. A API identifica as interfaces IPv4 do computador, prioriza a rede Wi-Fi e a central gera diretamente um QR para `http://IP-LOCAL:3000/#/responsaveis`. No celular, aponte a câmera, abra o link e escolha uma conta demonstrativa. Não é preciso instalar nada nem copiar o IP manualmente.

Confira o endereço exibido antes da apresentação. Se o computador possuir várias interfaces ou a rede escolhida não alcançar o celular, use **Usar outro endereço** e informe um endereço HTTPS ou o IPv4 correto da rede.

Celular e computador precisam estar na mesma rede, e a rede deve permitir comunicação entre aparelhos. Redes de convidados ou com isolamento podem impedir o acesso. A instalação PWA não funciona em todo endereço HTTP; isso não impede a demonstração comum no navegador.

## Aparelhos em redes diferentes

Se a rede Wi-Fi da apresentação não permitir o acesso local e houver internet, o apresentador pode iniciar `npm run presentation:tunnel` em outro terminal, desde que `cloudflared` já esteja instalado. O comando cria um endereço HTTPS temporário. Use **Usar outro endereço** na central e informe esse endereço para gerar o QR correto.

O túnel não inicia automaticamente nem é obrigatório. Enquanto ativo, torna a demonstração alcançável por quem tiver o endereço. Use somente contas e dados fictícios e encerre o terminal do túnel ao terminar. O computador, a API e o servidor web precisam permanecer ativos.

## Ensaio antes da apresentação

1. Leia o QR com outro celular e confirme que ele não contém `localhost`, `127.0.0.1` ou o endereço de uma sessão anterior.
2. Abra o portal pelo link, sem instalar PWA ou APK, e entre como responsável demonstrativo.
3. No painel do computador, registre uma passagem simulada; confirme a atualização no celular.
4. Envie uma justificativa textual pelo portal e analise-a como Coordenação/Direção. Não há upload de atestados ou outros arquivos.
5. Teste a interrupção e o retorno da API. A interface deve informar a indisponibilidade e não confirmar uma gravação que não aconteceu.
6. Tenha como alternativa a apresentação do painel e do portal em duas janelas do próprio computador.

## O que o QR Code faz

Ele codifica somente a URL direta da entrada do portal (`/#/responsaveis`). Não leva senha, token de sessão ou biometria, não autentica o responsável e não autoriza passagem de estudante. É diferente de um crachá de contingência com QR Code.

A sessão e os dados dependem da API ativa. O cache da PWA contém a interface estática e não substitui o backend. A experiência Android continua no repositório, mas não é necessário gerar ou distribuir outro APK para este ciclo.
