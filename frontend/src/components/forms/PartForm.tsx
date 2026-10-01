import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { itemsApi } from '../../api/items';
import { LIFE_CYCLE_PHASES, type PartRequest, type PartResponse } from '../../api/types';
import { enumLabel } from '../../lib/format';
import { Field, Select, TextArea, TextInput } from './FormField';
import { FormActions } from './FormActions';
import { RecordPicker, type PickerOption } from './RecordPicker';
import { applyServerError, blankToNull } from './serverErrors';
import type { EntityFormProps } from './types';

// Mirrors PartRequest validation in the backend.
const schema = z.object({
  partNumber: z.string().trim().min(1, 'Part number is required').max(50, 'At most 50 characters'),
  partName: z.string().trim().min(1, 'Part name is required').max(255, 'At most 255 characters'),
  description: z.string().optional(),
  manufactureName: z.string().max(255, 'At most 255 characters').optional(),
  lifeCyclePhase: z.enum(['DESIGN', 'PRODUCTION']),
  // Optional parent item (Item 1 : N Part).
  itemId: z.number().int().positive().nullable(),
});

const loadItems = (search: string): Promise<PickerOption[]> =>
  itemsApi
    .list({ search, size: 20 })
    .then((page) => page.content.map((i) => ({ id: i.id, code: i.itemNumber, name: i.itemName })));

type Values = z.infer<typeof schema>;

export function PartForm({ initial, onSubmit, onCancel }: EntityFormProps<PartResponse, PartRequest>) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      partNumber: initial?.partNumber ?? '',
      partName: initial?.partName ?? '',
      description: initial?.description ?? '',
      manufactureName: initial?.manufactureName ?? '',
      lifeCyclePhase: initial?.lifeCyclePhase ?? 'DESIGN',
      itemId: initial?.itemId ?? null,
    },
  });

  const submit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await onSubmit({
        partNumber: v.partNumber.trim(),
        partName: v.partName.trim(),
        description: blankToNull(v.description),
        manufactureName: blankToNull(v.manufactureName),
        lifeCyclePhase: v.lifeCyclePhase,
        itemId: v.itemId,
      });
    } catch (e) {
      setFormError(applyServerError(e, setError, 'partNumber'));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-2 gap-x-4">
        <Field label="Part Number" required error={errors.partNumber?.message}>
          <TextInput autoFocus {...register('partNumber')} error={errors.partNumber?.message} />
        </Field>
        <Field label="Part Name" required error={errors.partName?.message}>
          <TextInput {...register('partName')} error={errors.partName?.message} />
        </Field>
        <Field label="Manufacturer" error={errors.manufactureName?.message}>
          <TextInput {...register('manufactureName')} error={errors.manufactureName?.message} />
        </Field>
        <Field label="Lifecycle Phase" required error={errors.lifeCyclePhase?.message}>
          <Select
            {...register('lifeCyclePhase')}
            options={LIFE_CYCLE_PHASES.map((p) => ({ value: p, label: enumLabel(p) }))}
          />
        </Field>
      </div>
      <Field label="Item" error={errors.itemId?.message}>
        <Controller
          control={control}
          name="itemId"
          render={({ field }) => (
            <RecordPicker
              queryKey={['items', 'picker']}
              load={loadItems}
              placeholder="Optional: search item number or name..."
              emptyText="No items found"
              initial={
                initial?.itemId
                  ? { id: initial.itemId, code: initial.itemNumber ?? '', name: initial.itemName }
                  : null
              }
              onSelect={(item) => field.onChange(item ? item.id : null)}
            />
          )}
        />
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <TextArea {...register('description')} />
      </Field>
      <FormActions
        submitting={isSubmitting}
        submitLabel={initial ? 'Save changes' : 'Add Part'}
        error={formError}
        onCancel={onCancel}
      />
    </form>
  );
}
