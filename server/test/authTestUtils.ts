const identifiers: Record<string, string> = {
  'guardian-1': 'claudia.mendes@gmail.com',
  'guardian-2': 'rodrigo.oliveira@gmail.com',
  'guardian-empty': 'sem.vinculo@gmail.com',
  'staff-1': 'carlos.mendes@emef.educacao.sp.gov.br',
  'staff-2': 'mariana.costa@emef.educacao.sp.gov.br',
  'staff-3': 'valdemar.ramos@emef.educacao.sp.gov.br',
};

export const loginAs = async (baseUrl: string, actorId: string) => {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: identifiers[actorId], password: 'Troia@2026' }),
  });
  const body = await response.json() as { data: { token: string } };
  if (!response.ok) throw new Error(`Falha no login de teste para ${actorId}.`);
  return body.data.token;
};

export const apiRequest = async (
  baseUrl: string,
  pathname: string,
  actorId?: string,
  init: RequestInit = {},
) => {
  const headers = new Headers(init.headers);
  if (actorId) headers.set('Authorization', `Bearer ${await loginAs(baseUrl, actorId)}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${baseUrl}${pathname}`, { ...init, headers });
  const body = response.status === 204 ? {} : await response.json() as Record<string, any>;
  return { response, body };
};
