type Redirect = { redirect_url?: string; redirect_to?: string };
export type ConsentDetails = {
  client: { name: string };
  redirect_uri: string;
  scope: string;
  user: { email: string };
};
type Result = { data: ConsentDetails | Redirect | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<Result>;
  approveAuthorization: (id: string) => Promise<Result>;
  denyAuthorization: (id: string) => Promise<Result>;
};

export function consentRedirect(data: Redirect): string {
  const target = data.redirect_url ?? data.redirect_to;
  if (!target) throw new Error("Não foi possível retornar ao agente. Tente novamente.");
  return target;
}

export async function loadConsent(api: OAuthApi, id: string) {
  if (!id) throw new Error("Solicitação ausente. Inicie a conexão novamente pelo agente.");
  const { data, error } = await api.getAuthorizationDetails(id);
  if (error || !data) throw new Error("Solicitação inválida ou expirada. Inicie a conexão novamente pelo agente.");
  if ("client" in data) return { details: data, redirect: null };
  return { details: null, redirect: consentRedirect(data) };
}

export async function decideConsent(api: OAuthApi, id: string, approve: boolean) {
  const { data, error } = approve
    ? await api.approveAuthorization(id)
    : await api.denyAuthorization(id);
  if (error || !data) throw new Error("Não foi possível confirmar sua decisão. Tente novamente.");
  if ("client" in data) throw new Error("Resposta incompleta. Tente novamente.");
  return consentRedirect(data);
}