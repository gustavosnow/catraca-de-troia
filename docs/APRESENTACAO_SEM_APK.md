# Apresentação do app sem APK

O portal dos responsáveis já é uma PWA: a mesma aplicação web pode abrir no navegador, adaptar-se à tela do celular e ser adicionada à tela inicial. Não é necessário instalar APK para demonstrar a experiência móvel.

## Opção recomendada para a apresentação acadêmica

Use o computador como servidor temporário e compartilhe um endereço HTTPS durante a apresentação:

1. No projeto, execute `npm run presentation:start`. O comando gera o build de produção, inicia a API SQLite local e serve a PWA em `http://localhost:3000`.
2. Em outro terminal, execute `npm run presentation:tunnel`. Esse comando pressupõe que o `cloudflared` esteja instalado e cria um endereço HTTPS temporário `*.trycloudflare.com`.
3. Abra o endereço informado e acrescente `/#/responsaveis`.
4. No painel escolar, a opção **Ferramentas → Apresentar app sem APK** exibe o QR Code e permite copiar ou compartilhar o endereço atual.
5. No Android, use o convite **Instalar** ou a opção **Adicionar à tela inicial**. No iPhone, use **Compartilhar → Adicionar à Tela de Início**.

O acesso em uma tela pequena já usa automaticamente o layout de aplicativo, mesmo antes da instalação. Quando instalada, a PWA abre em uma janela própria, com ícone e sem a barra comum do navegador.

## Alternativa sem internet

Execute `npm run dev:device` e compartilhe o endereço IPv4 do computador, como `http://192.168.x.x:3000/#/responsaveis`, com aparelhos na mesma rede Wi-Fi. Essa alternativa reproduz a interface móvel sem baixar APK, mas o HTTP por IP normalmente não satisfaz o requisito de contexto seguro para instalação da PWA. Ela funciona como demonstração no navegador.

## Limites e segurança

- Quick Tunnels são temporários, não possuem garantia de disponibilidade e mudam de endereço quando reiniciados.
- Qualquer pessoa com o endereço público pode alcançar a demonstração enquanto o túnel estiver ativo. Encerre-o ao terminar.
- Use somente as contas e os dados fictícios já incluídos no projeto.
- A API e o SQLite continuam no computador do apresentador; isso não é hospedagem nem infraestrutura de produção.
- O cache da PWA contém somente a interface estática. Login e dados pessoais ainda dependem da API ativa.
- Para uma URL permanente seria necessário um ambiente hospedado com API, HTTPS, persistência e controles institucionais; isso não faz parte da apresentação acadêmica atual.

Referências: [instalação de PWA e requisito de HTTPS](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) e [Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).
