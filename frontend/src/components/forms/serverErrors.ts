import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../../api/client';

/**
 * Puts backend errors onto the form: validation field errors onto their
 * inputs, a 409 (duplicate number) onto the unique field. Returns a message
 * for anything that does not belong to a field.
 */
export function applyServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  uniqueField?: Path<T>,
): string | null {
  if (!(error instanceof ApiError)) {
    return 'Unexpected error';
  }
  const fields = Object.entries(error.fieldErrors);
  if (fields.length > 0) {
    fields.forEach(([field, message]) => setError(field as Path<T>, { type: 'server', message }));
    return null;
  }
  if (error.status === 409 && uniqueField) {
    setError(uniqueField, { type: 'server', message: error.detail });
    return null;
  }
  return error.detail;
}

/** '' -> null so optional text fields are stored as NULL, not empty strings. */
export function blankToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
