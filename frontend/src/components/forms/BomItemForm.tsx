import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { bomApi } from '../../api/bom';
import type { BomLinkRequest, BomNode } from '../../api/types';
import { Field, TextInput } from './FormField';
import { FormActions } from './FormActions';
import { RecordPicker, type PickerOption } from './RecordPicker';
import { applyServerError } from './serverErrors';

// Mirrors BomLinkRequest validation in the backend (quantity NUMERIC(12,3) > 0).
const schema = z.object({
  parentId: z.number({ required_error: 'Select a parent item', invalid_type_error: 'Select a parent item' }).int().positive(),
  childId: z.number({ required_error: 'Select an item', invalid_type_error: 'Select an item' }).int().positive(),
  quantity: z
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity is required' })
    .positive('Quantity must be greater than 0')
    .max(999_999_999, 'Quantity is too large')
    .refine((q) => Math.abs(q * 1000 - Math.round(q * 1000)) < 1e-6, 'At most 3 decimal places'),
});

type Values = z.infer<typeof schema>;

interface Props {
  /** Fixed parent (row "+"). When omitted, the user picks a top-level (BOM root) item. */
  parent?: BomNode;
  /** Resolves on success; rejects with ApiError on failure. */
  onSubmit: (parentId: number, request: BomLinkRequest) => Promise<void>;
  onCancel: () => void;
}

const loadRoots = (search: string): Promise<PickerOption[]> =>
  bomApi
    .roots({ search, size: 20 })
    .then((page) => page.content.map((n) => ({ id: n.itemId, code: n.itemNumber, name: n.itemName })));

const loadCandidates = (parentId: number, search: string): Promise<PickerOption[]> =>
  bomApi
    .candidates(parentId, { search, size: 20 })
    .then((page) => page.content.map((i) => ({ id: i.id, code: i.itemNumber, name: i.itemName })));

/** "Add BOM Item": pick a child item and quantity to add under a parent. */
export function BomItemForm({ parent, onSubmit, onCancel }: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { parentId: parent?.itemId, quantity: 1 },
  });
  const parentId = watch('parentId');

  const submit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await onSubmit(v.parentId, { childId: v.childId, quantity: v.quantity });
    } catch (e) {
      setFormError(applyServerError(e, setError, 'childId'));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      {parent ? (
        <p className="mb-4 rounded-md border border-line bg-toolbar px-3 py-2 text-sm text-muted">
          Parent item: <span className="font-medium text-link">{parent.itemNumber}</span>{' '}
          <span className="text-ink">{parent.itemName}</span>
        </p>
      ) : (
        <Field label="Parent Item" required error={errors.parentId?.message}>
          <Controller
            control={control}
            name="parentId"
            render={({ field, fieldState }) => (
              <RecordPicker
                queryKey={['bom', 'roots', 'picker']}
                load={loadRoots}
                autoFocus
                placeholder="Search top-level items..."
                emptyText="No top-level items found"
                error={fieldState.error?.message}
                onSelect={(item) => {
                  field.onChange(item ? item.id : undefined);
                  setValue('childId', undefined as unknown as number);
                }}
              />
            )}
          />
        </Field>
      )}
      <Field label="Item" required error={errors.childId?.message}>
        <Controller
          control={control}
          name="childId"
          render={({ field, fieldState }) => (
            <RecordPicker
              // Reset the choice when the parent changes.
              key={parentId ?? 'none'}
              queryKey={['bom', 'candidates', parentId]}
              load={(search) => loadCandidates(parentId, search)}
              disabled={!parentId}
              autoFocus={!!parent}
              placeholder={parentId ? undefined : 'Select a parent item first'}
              error={fieldState.error?.message}
              onSelect={(item) => field.onChange(item ? item.id : undefined)}
            />
          )}
        />
      </Field>
      <Field label="Quantity" required error={errors.quantity?.message}>
        <TextInput
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          {...register('quantity', { valueAsNumber: true })}
          error={errors.quantity?.message}
        />
      </Field>
      <FormActions submitting={isSubmitting} submitLabel="Add BOM" error={formError} onCancel={onCancel} />
    </form>
  );
}
