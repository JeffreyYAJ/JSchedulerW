export const API_BASE_URL = 'http://localhost:3000/api';

export interface Student {
  id: number;
  nom: string;
  genre: string;
  date_dernier_expose: string | null;
  status?: string;
}

export interface Programme {
  id: number;
  date_debut_semaine: string;
  date_fin_semaine: string;
  contient_discours: boolean | number;
}

export interface AffectationDetail {
  affectation_id: number;
  type_expose: string;
  role: string;
  eleve_id: number;
  nom: string;
  genre: string;
}

export interface HistoriqueEntry extends AffectationDetail {
  date_debut_semaine: string;
  date_fin_semaine: string;
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Erreur HTTP ${response.status}`);
  }
  return data;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  return parseJson<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson<T>(response);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson<T>(response);
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Erreur HTTP ${response.status}`);
  }
}

export function programmeHasDiscours(p: Programme): boolean {
  return p.contient_discours === true || p.contient_discours === 1;
}

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
