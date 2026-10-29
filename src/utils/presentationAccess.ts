export type PresentationAccess = {
  url?: string;
  error?: string;
  localNetwork?: boolean;
};

// Um QR de localhost não funciona em outro aparelho: ele aponta para o próprio celular.
export function getPresentationAccess(input: string): PresentationAccess {
  try {
    const url = new URL(input.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      return { error: 'Informe um endereço HTTP ou HTTPS, sem credenciais.' };
    }
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0'
      || host === '[::1]' || /^127\./.test(host)) {
      return { error: 'Este endereço só funciona neste computador. Informe o endereço HTTPS da apresentação ou o IP do computador na rede Wi-Fi.' };
    }
    url.search = '';
    url.hash = '/responsaveis';
    return { url: url.toString(), localNetwork: url.protocol === 'http:' };
  } catch {
    return { error: 'Informe o endereço completo da apresentação, incluindo https:// ou http://.' };
  }
}
