import { randomBytes, scryptSync } from 'node:crypto';
import type Database from 'better-sqlite3';

/** E-mail em minúsculas; telefone e CPF reduzidos aos dígitos. */
export const normalizeIdentifier = (value: string) => {
  const trimmed = value.trim().toLocaleLowerCase('pt-BR');
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 10 ? digits : trimmed;
};

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return { salt, hash: scryptSync(password, salt, 64).toString('hex') };
};

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Grava a senha de um usuário para cada identificador (e-mail, telefone, CPF ou
 * matrícula funcional). Recusa identificadores que já pertencem a outra conta.
 */
export const registerCredentials = (
  database: Database.Database,
  userId: string,
  identifiers: string[],
  password: string,
) => {
  const normalized = [...new Set(identifiers.filter(Boolean).map(normalizeIdentifier))];
  const owner = database.prepare('SELECT user_id FROM auth_identities WHERE normalized_identifier = ?');
  for (const identifier of normalized) {
    const existing = owner.get(identifier) as { user_id: string } | undefined;
    if (existing && existing.user_id !== userId) {
      throw new Error(`O identificador ${identifier} já pertence a outra conta.`);
    }
  }
  const insert = database.prepare(`
    INSERT OR REPLACE INTO auth_identities (normalized_identifier, user_id, password_salt, password_hash)
    VALUES (?, ?, ?, ?)
  `);
  for (const identifier of normalized) {
    const { salt, hash } = hashPassword(password);
    insert.run(identifier, userId, salt, hash);
  }
  return normalized;
};
