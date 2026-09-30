import { Button } from '../ui/Button';

interface Props {
  submitting: boolean;
  submitLabel: string;
  error: string | null;
  onCancel: () => void;
}

export function FormActions({ submitting, submitLabel, error, onCancel }: Props) {
  return (
    <>
      {error && (
        <p role="alert" className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="-mx-5 -mb-4 mt-2 flex justify-end gap-2 border-t border-line bg-toolbar px-5 py-3">
        <Button onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </>
  );
}
