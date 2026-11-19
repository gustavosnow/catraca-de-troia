import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = process.cwd();
const webPort = 4174;
const bidiPort = 9234;
const baseUrl = `http://127.0.0.1:${webPort}`;
const outputDirectory = path.join(root, '.artifacts', 'visual-acceptance');
const profileDirectory = mkdtempSync(path.join(tmpdir(), 'catraca-firefox-'));
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(path.join(profileDirectory, 'user.js'), 'user_pref("ui.prefersReducedMotion", 1);\n');

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForHttp = async (url, attempts = 60) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // O servidor ainda está iniciando.
    }
    await wait(250);
  }
  throw new Error(`Servidor visual indisponível em ${url}.`);
};

const connectWebSocket = async (url, attempts = 60) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const socket = new WebSocket(url);
      await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', reject, { once: true });
      });
      return socket;
    } catch {
      await wait(250);
    }
  }
  throw new Error(`WebDriver BiDi indisponível em ${url}.`);
};

const vite = spawn(path.join(root, 'node_modules', '.bin', 'vite'), [
  '--port', String(webPort),
  '--host', '127.0.0.1',
  '--strictPort',
], {
  cwd: root,
  env: { ...process.env, DISABLE_HMR: 'true' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let firefox;
let socket;

try {
  await waitForHttp(`${baseUrl}/visual-tests/parent-portal.html`);

  firefox = spawn('firefox', [
    '--headless',
    '--remote-debugging-port', String(bidiPort),
    '--profile', profileDirectory,
    `${baseUrl}/visual-tests/parent-portal.html`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  socket = await connectWebSocket(`ws://127.0.0.1:${bidiPort}/session`);
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    if (message.type === 'error') handler.reject(new Error(`${message.error}: ${message.message}`));
    else handler.resolve(message.result);
  });

  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId;
    nextId += 1;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  await command('session.new', { capabilities: { alwaysMatch: {} } });
  const tree = await command('browsingContext.getTree');
  const context = tree.contexts[0].context;

  const evaluate = async (expression) => {
    const response = await command('script.evaluate', {
      expression,
      target: { context },
      awaitPromise: true,
      resultOwnership: 'none',
    });
    if (response.result.type === 'exception') throw new Error(response.result.exceptionDetails.text);
    return response.result.value;
  };

  const click = async (selector) => {
    const result = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!(element instanceof HTMLElement)) return 'missing';
      element.focus();
      element.click();
      return 'clicked';
    })()`);
    if (result !== 'clicked') throw new Error(`Elemento visual não encontrado: ${selector}`);
    await wait(180);
  };

  const pressKey = async (value) => {
    await command('input.performActions', {
      context,
      actions: [{
        type: 'key',
        id: 'acceptance-keyboard',
        actions: [
          { type: 'keyDown', value },
          { type: 'keyUp', value },
        ],
      }],
    });
    await command('input.releaseActions', { context });
    await wait(180);
  };

  const assertActivePage = async (selector) => {
    const value = await evaluate(`document.querySelector(${JSON.stringify(selector)})?.getAttribute('aria-current') ?? ''`);
    if (value !== 'page') throw new Error(`Navegação ativa ausente em ${selector}.`);
  };

  const closeDialogWithEscape = async (dialogSelector, triggerSelector) => {
    await pressKey('\uE00C');
    const raw = await evaluate(`JSON.stringify({
      dialogOpen: Boolean(document.querySelector(${JSON.stringify(dialogSelector)})),
      focusRestored: document.activeElement?.matches(${JSON.stringify(triggerSelector)}) ?? false,
    })`);
    const result = JSON.parse(raw);
    if (result.dialogOpen || !result.focusRestored) {
      throw new Error(`Escape/foco falhou para ${dialogSelector}: ${JSON.stringify(result)}.`);
    }
  };

  const capture = async (filename) => {
    const overflow = JSON.parse(await evaluate(`JSON.stringify((() => {
      const visibleDialogs = [...document.querySelectorAll('[role="dialog"]')]
        .filter((dialog) => dialog.getClientRects().length > 0);
      return {
        viewport: document.documentElement.scrollWidth > window.innerWidth + 1,
        dialogs: visibleDialogs.filter((dialog) => dialog.scrollWidth > dialog.clientWidth + 1).length,
      };
    })())`));
    if (overflow.viewport || overflow.dialogs > 0) {
      throw new Error(`${filename}: rolagem horizontal detectada.`);
    }
    const result = await command('browsingContext.captureScreenshot', {
      context,
      origin: 'viewport',
      format: { type: 'png' },
    });
    writeFileSync(path.join(outputDirectory, filename), Buffer.from(result.data, 'base64'));
  };

  const assertResponsiveLayout = async (width, view) => {
    const raw = await evaluate(`JSON.stringify((() => {
      const header = document.querySelector('[data-testid="parent-header"]');
      const brand = document.querySelector('[data-testid="parent-brand"]');
      const actions = document.querySelector('[data-testid="parent-header-actions"]');
      const school = document.querySelector('[data-testid="parent-school"]');
      const overlaps = (left, right) => {
        if (!left || !right) return true;
        const a = left.getBoundingClientRect();
        const b = right.getBoundingClientRect();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      };
      const viewportOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
      const headerOverflow = header ? header.scrollWidth > header.clientWidth + 1 : true;
      const schoolVisible = school?.textContent?.includes('Escola Municipal Catraca de Troia') ?? false;
      const studentCards = [...document.querySelectorAll('[data-testid="parent-students"] button')];
      const clippedStudentCards = studentCards.filter((card) => card.scrollWidth > card.clientWidth + 1).length;
      return {
        viewportOverflow,
        headerOverflow,
        brandActionsOverlap: overlaps(brand, actions),
        schoolVisible,
        clippedStudentCards,
      };
    })())`);
    const result = JSON.parse(raw);
    const failures = Object.entries({
      viewportOverflow: result.viewportOverflow,
      headerOverflow: result.headerOverflow,
      brandActionsOverlap: result.brandActionsOverlap,
      schoolMissing: !result.schoolVisible,
      clippedStudentCards: result.clippedStudentCards > 0,
    }).filter(([, failed]) => failed).map(([name]) => name);
    if (failures.length > 0) {
      throw new Error(`${width}px/${view}: ${failures.join(', ')}`);
    }
  };

  const assertGuardianLinkRequestLayout = async (width, view) => {
    const raw = await evaluate(`JSON.stringify((() => {
      const section = document.querySelector('[data-testid="guardian-link-requests"]');
      const form = document.querySelector('[data-testid="guardian-link-request-form"]');
      if (!(section instanceof HTMLElement) || !(form instanceof HTMLElement)) return { missing: true };
      const sectionRect = section.getBoundingClientRect();
      const overflowingChildren = [...form.children].filter((child) => {
        const rect = child.getBoundingClientRect();
        return rect.left < sectionRect.left - 1 || rect.right > sectionRect.right + 1;
      }).length;
      const request = section.querySelector('li');
      const note = [...(request?.querySelectorAll('p') ?? [])].find((paragraph) => paragraph.textContent.includes('Observação da escola:'));
      const requestStyle = request && getComputedStyle(request);
      const textWidth = request ? request.clientWidth - parseFloat(requestStyle.paddingLeft) - parseFloat(requestStyle.paddingRight) : 0;
      return {
        missing: false,
        formOverflow: form.scrollWidth > form.clientWidth + 1,
        overflowingChildren,
        narrowedReviewNote: !note || note.getBoundingClientRect().width < textWidth - 1,
        requestOverflow: request ? request.scrollWidth > request.clientWidth + 1 : true,
      };
    })())`);
    const result = JSON.parse(raw);
    if (result.missing || result.formOverflow || result.overflowingChildren > 0 || result.narrowedReviewNote || result.requestOverflow) {
      throw new Error(`${width}px/${view}: formulário ou cartão de vínculo sem espaço para leitura: ${JSON.stringify(result)}.`);
    }
  };

  const assertModalScrollLayout = async (width, compact) => {
    const raw = await evaluate(`JSON.stringify((() => {
      const dialog = document.querySelector('[aria-labelledby="absence-modal-title"]');
      const scrollRegion = document.querySelector('[data-testid="absence-modal-scroll-region"]');
      if (!(dialog instanceof HTMLElement) || !(scrollRegion instanceof HTMLElement)) return { missing: true };
      const dialogRect = dialog.getBoundingClientRect();
      const canOverflow = ['auto', 'scroll'].includes(getComputedStyle(scrollRegion).overflowY);
      const hasScrollableContent = scrollRegion.scrollHeight > scrollRegion.clientHeight + 1;
      const luminance = (color) => {
        const [r, g, b] = (color.match(/[\\d.]+/g) || []).slice(0, 3).map(Number).map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const formFields = [...dialog.querySelectorAll('input, select, textarea')];
      const fieldsUseReadableText = formFields.length >= 3
        && formFields.every((field) => luminance(getComputedStyle(field).color) < 0.05);
      if (hasScrollableContent) scrollRegion.scrollTop = Math.min(120, scrollRegion.scrollHeight - scrollRegion.clientHeight);
      return {
        missing: false,
        dialogInsideViewport: dialogRect.top >= -1 && dialogRect.bottom <= window.innerHeight + 1
          && dialogRect.left >= -1 && dialogRect.right <= window.innerWidth + 1,
        compactFillsViewport: Math.abs(dialogRect.top) <= 2 && Math.abs(dialogRect.bottom - window.innerHeight) <= 2,
        canOverflow,
        hasScrollableContent,
        fieldsUseReadableText,
        scrolled: !hasScrollableContent || scrollRegion.scrollTop > 0,
      };
    })())`);
    const result = JSON.parse(raw);
    const failed = result.missing || !result.canOverflow || !result.scrolled || !result.fieldsUseReadableText
      || !result.dialogInsideViewport || (compact && !result.compactFillsViewport);
    if (failed) throw new Error(`${width}px/modal: rolagem ou encaixe inválido: ${JSON.stringify(result)}.`);
  };

  const assertNavigationPlacement = async (width, view) => {
    const raw = await evaluate(`JSON.stringify((() => {
      const header = document.querySelector('[data-testid="parent-header"]');
      const nav = document.querySelector('[aria-label="Navegação do portal dos responsáveis"]');
      const main = document.querySelector('#parent-app-content');
      if (!(header instanceof HTMLElement) || !(nav instanceof HTMLElement) || !(main instanceof HTMLElement)) return { missing: true };
      const navRect = nav.getBoundingClientRect();
      const position = getComputedStyle(nav).position;
      const mainPaddingBottom = Number.parseFloat(getComputedStyle(main).paddingBottom || '0');
      return {
        missing: false,
        position,
        viewport: [document.documentElement.clientWidth, document.documentElement.clientHeight, window.innerWidth, window.innerHeight],
        navBox: [Math.round(navRect.width), Math.round(navRect.bottom)],
        bottomBar: position === 'fixed'
          && Math.abs(navRect.bottom - document.documentElement.clientHeight) <= 1
          && navRect.width >= document.documentElement.clientWidth - 1,
        contentClearsBar: mainPaddingBottom >= navRect.height,
        inHeader: position === 'static' && navRect.top >= header.getBoundingClientRect().top - 1
          && navRect.bottom <= header.getBoundingClientRect().bottom + 1,
      };
    })())`);
    const result = JSON.parse(raw);
    const mobile = width < 768;
    const failed = result.missing || (mobile ? (!result.bottomBar || !result.contentClearsBar) : !result.inHeader);
    if (failed) throw new Error(`${width}px/${view}: navegação fora do lugar: ${JSON.stringify(result)}.`);
  };

  const accountMenu = '[aria-label="Abrir menu da conta"]';
  const cases = [320, 360, 390, 440, 768, 1440];
  const executed = [];
  for (const width of cases) {
    await command('browsingContext.setViewport', {
      context,
      viewport: { width, height: width <= 440 ? 800 : 900 },
      devicePixelRatio: 1,
    });
    await command('browsingContext.navigate', {
      context,
      url: `${baseUrl}/visual-tests/parent-portal.html`,
      wait: 'complete',
    });
    await wait(350);

    const reducedMotion = await evaluate(`window.matchMedia('(prefers-reduced-motion: reduce)').matches`);
    if (!reducedMotion) throw new Error('Preferência de redução de movimento não aplicada no navegador de aceite.');

    await assertResponsiveLayout(width, 'home');
    await assertNavigationPlacement(width, 'home');
    await assertActivePage('#tab-parent-home');
    await capture(`parent-${width}-home.png`);
    executed.push(`${width}px:home`);

    await click('#tab-parent-history');
    await assertActivePage('#tab-parent-history');
    await assertResponsiveLayout(width, 'history');
    await capture(`parent-${width}-history.png`);
    executed.push(`${width}px:history`);

    await click('#tab-parent-notices');
    await assertActivePage('#tab-parent-notices');
    await assertResponsiveLayout(width, 'notices');
    if (await evaluate(`document.querySelector('[data-testid="guardian-link-requests"]') !== null`)) {
      throw new Error(`${width}px: Avisos ainda contém o formulário de vínculo.`);
    }
    await capture(`parent-${width}-notices.png`);
    executed.push(`${width}px:notices`);

    await click(accountMenu);
    await click('#btn-parent-links');
    if (!(await evaluate(`document.activeElement?.matches('#parent-links-title')`))) {
      throw new Error(`${width}px: menu da conta não abriu Meus vínculos com foco no título.`);
    }
    await assertGuardianLinkRequestLayout(width, 'links');
    await capture(`parent-${width}-links.png`);
    executed.push(`${width}px:links`);
    if (width === 320) {
      await evaluate(`document.querySelector('[data-testid="guardian-link-requests"] li')?.scrollIntoView({ block: 'center' })`);
      await capture('parent-320-link-note.png');
    }

    await click('#tab-parent-home');
    await click('#btn-parent-notifications');
    if (width === 320) {
      const notificationHeaderFits = await evaluate(`(() => {
        const row = document.querySelector('[aria-labelledby="notification-drawer-title"] li:last-child');
        const title = row?.querySelector('p');
        const timestamp = title?.nextElementSibling;
        return Boolean(timestamp && timestamp.getBoundingClientRect().top >= title.getBoundingClientRect().bottom - 1);
      })()`);
      if (!notificationHeaderFits) throw new Error('320px: a data deve ficar abaixo do título comprido da notificação.');
    }
    await capture(`parent-${width}-notifications.png`);
    executed.push(`${width}px:notifications`);
    await closeDialogWithEscape('[aria-labelledby="notification-drawer-title"]', '#btn-parent-notifications');

    await click('#tab-parent-absence');
    await assertModalScrollLayout(width, width <= 440);
    await capture(`parent-${width}-absence.png`);
    executed.push(`${width}px:absence`);
    await closeDialogWithEscape('[aria-labelledby="absence-modal-title"]', '#tab-parent-absence');
  }

  const installOption = '[role="menu"] #btn-parent-install';
  const installDialog = '[aria-labelledby="parent-install-help-title"]';
  await command('browsingContext.setViewport', { context, viewport: { width: 360, height: 800 }, devicePixelRatio: 1 });
  await click('#tab-parent-home');
  await click('#btn-parent-home-links');
  await assertGuardianLinkRequestLayout(360, 'links-from-home');
  executed.push('360px:links-from-home');
  for (const tab of ['home', 'history', 'notices']) {
    await click(`#tab-parent-${tab}`);
    if (await evaluate(`document.querySelector('aside[aria-label="Adicionar à tela inicial"]') !== null`)) {
      throw new Error(`${tab}: o convite de instalação não deve ficar no conteúdo da aba.`);
    }
    await click(accountMenu);
    const options = await evaluate(`document.querySelectorAll(${JSON.stringify(installOption)}).length`);
    if (options !== 1) throw new Error(`${tab}: a instalação deve ter um único atalho no menu da conta.`);
    await click(accountMenu);
  }
  await click(accountMenu);
  await click(installOption);
  if (!(await evaluate(`document.querySelector(${JSON.stringify(installDialog)})?.textContent.includes('Abra o menu do navegador')`))) {
    throw new Error('Instruções de instalação manual ausentes.');
  }
  await capture('parent-360-install-help.png');
  await closeDialogWithEscape(installDialog, accountMenu);
  executed.push('360px:install-help');

  await evaluate(`(() => {
    const prompt = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(prompt, {
      prompt: async () => { document.body.dataset.installPromptOpened = 'true'; },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(prompt);
    return true;
  })()`);
  await click(accountMenu);
  await click(installOption);
  if (!(await evaluate(`document.body.dataset.installPromptOpened === 'true' && !document.querySelector(${JSON.stringify(installDialog)})`))) {
    throw new Error('Convite nativo não recebeu a ação de instalação.');
  }
  await evaluate(`window.dispatchEvent(new Event('appinstalled'))`);
  await click(accountMenu);
  if (await evaluate(`document.querySelector(${JSON.stringify(installOption)}) !== null`)) {
    throw new Error('Atalho de instalação ainda aparece após instalar o portal.');
  }
  await click(accountMenu);
  executed.push('360px:install-prompt');

  await command('browsingContext.navigate', {
    context,
    url: `${baseUrl}/visual-tests/parent-portal.html?sem-vinculo`,
    wait: 'complete',
  });
  await click(accountMenu);
  if (!(await evaluate(`document.querySelector('#no-student-title') && document.querySelector(${JSON.stringify(installOption)}) !== null`))) {
    throw new Error('Atalho de instalação ausente para responsável sem vínculo.');
  }
  await assertGuardianLinkRequestLayout(360, 'links-without-student');
  executed.push('360px:install-without-link');

  await command('browsingContext.setViewport', {
    context,
    viewport: { width: 1440, height: 480 },
    devicePixelRatio: 1,
  });
  await command('browsingContext.navigate', {
    context,
    url: `${baseUrl}/visual-tests/parent-portal.html`,
    wait: 'complete',
  });
  await wait(350);
  await assertNavigationPlacement(1440, 'short-viewport');
  await click('#tab-parent-notices');
  await evaluate(`(() => {
    const scrollingElement = document.scrollingElement;
    if (scrollingElement) scrollingElement.scrollTop = scrollingElement.scrollHeight;
    return true;
  })()`);
  await wait(500);
  await capture('parent-1440-short-viewport-notices.png');
  executed.push('1440px:short-viewport-notices');
  await click('#tab-parent-absence');
  await assertModalScrollLayout(1440, false);
  await capture('parent-1440-short-viewport-absence.png');
  executed.push('1440px:short-viewport-absence');
  await closeDialogWithEscape('[aria-labelledby="absence-modal-title"]', '#tab-parent-absence');

  for (const width of [360, 1440]) {
    await command('browsingContext.setViewport', {
      context,
      viewport: { width, height: width === 360 ? 800 : 900 },
      devicePixelRatio: 1,
    });
    await command('browsingContext.navigate', {
      context,
      url: `${baseUrl}/visual-tests/parent-portal.html`,
      wait: 'complete',
    });
    await wait(250);
    await click('#visual-toggle-connectivity');
    const offlineMessage = await evaluate(`document.body.textContent?.includes('Sem conexão. Exibindo apenas os dados já carregados nesta sessão.') ?? false`);
    const absenceDisabled = await evaluate(`document.querySelector('#tab-parent-absence')?.hasAttribute('disabled') ?? false`);
    if (!offlineMessage || !absenceDisabled) throw new Error(`${width}px: estado offline incompleto.`);
    await capture(`parent-${width}-offline.png`);
    executed.push(`${width}px:offline`);
    await click('#visual-toggle-connectivity');
    const onlineMessage = await evaluate(`document.body.textContent?.includes('Dados do servidor da escola') ?? false`);
    if (!onlineMessage) throw new Error(`${width}px: retomada da conectividade não refletida.`);
  }

  const presentationViewports = [];
  for (const [width, height] of [[360, 740], [740, 360], [1366, 618], [1440, 900]]) {
    await command('browsingContext.setViewport', { context, viewport: { width, height }, devicePixelRatio: 1 });
    await command('browsingContext.navigate', { context, url: `${baseUrl}/#/projeto/1`, wait: 'complete' });
    for (let attempt = 0; attempt < 30; attempt++) {
      if (await evaluate('Boolean(document.querySelector(".deck-slide"))')) break;
      await wait(100);
    }

    for (let number = 1; number <= 21; number++) {
      const issue = await evaluate(`(() => {
        const slide = document.querySelector('.deck-slide');
        if (!slide?.getAttribute('aria-label')?.startsWith('${number} de 21:')) return 'slide incorreto';
        const header = slide.previousElementSibling.getBoundingClientRect();
        const footer = slide.nextElementSibling.getBoundingClientRect();
        const area = slide.getBoundingClientRect();
        const content = slide.querySelector('.deck-inner');
        if (area.top < header.bottom - 1 || area.bottom > footer.top + 1) return 'barras sobre o conteúdo';
        slide.scrollTop = 0;
        if (content.getBoundingClientRect().top < area.top - 1) return 'início cortado';
        slide.scrollTop = slide.scrollHeight;
        if (content.getBoundingClientRect().bottom > area.bottom + 1) return 'fim inacessível pela rolagem';
        if (document.documentElement.scrollWidth > innerWidth) return 'rolagem horizontal da página';
        return '';
      })()`);
      if (issue) throw new Error(`Apresentação ${width}×${height}, slide ${number}: ${issue}.`);
      if (number < 21) await pressKey('\uE014');
    }
    presentationViewports.push(`${width}×${height}`);
  }

  const overviewButton = 'button[aria-label="Ver todos os slides (G)"]';
  const overview = '[aria-label="Todos os slides"]';
  await click(overviewButton);
  const focusInside = await evaluate(`document.querySelector('${overview}')?.contains(document.activeElement)`);
  if (!focusInside) throw new Error('O sumário da apresentação abriu sem foco.');
  await closeDialogWithEscape(overview, overviewButton);

  console.log(`Aceite visual concluído: ${executed.length} cenários.`);
  console.log(`Apresentação: 21 slides conferidos em ${presentationViewports.join(", ")}.`);
  console.log(`Evidências: ${path.relative(root, outputDirectory)}`);
  console.log(executed.join('\n'));
  writeFileSync(path.join(outputDirectory, 'results.json'), `${JSON.stringify({
    executedAt: new Date().toISOString(),
    browser: 'Firefox headless via WebDriver BiDi',
    scenarios: executed,
    presentationViewports,
    result: 'PASS',
  }, null, 2)}\n`);
  await command('session.end');
} finally {
  socket?.close();
  firefox?.kill('SIGTERM');
  vite.kill('SIGTERM');
  rmSync(profileDirectory, { recursive: true, force: true });
}
