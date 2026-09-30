import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ITEM_TYPES, LIFE_CYCLE_PHASES, type ItemRequest, type ItemResponse } from '../../api/types';
import { enumLabel } from '../../lib/format';
import { Field, Select, TextArea, TextInput } from './FormField';
import { FormActions } from './FormActions';
import { applyServerError, blankToNull } from './serverErrors';
import type { EntityFormProps } from './types';

// Mirrors ItemRequest validation in the backend.
const schema = z.object({
  itemNumber: z.string().trim().min(1, 'Item number is required').max(50, 'At most 50 characters'),
  itemName: z.string().trim().min(1, 'Item name is required').max(255, 'At most 255 characters'),
  description: z.string().optional(),
  type: z.enum(['ASSEMBLY', 'FINISHED']),
  lifeCyclePhase: z.enum(['DESIGN', 'PRODUCTION']),
  productFamily: z.string().max(100, 'At most 100 characters').optional(),
});

type Values = z.infer<typeof schema>;

export function ItemForm({ initial, onSubmit, onCancel }: EntityFormProps<ItemResponse, ItemRequest>) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      itemNumber: initial?.itemNumber ?? '',
      itemName: initial?.itemName ?? '',
      description: initial?.description ?? '',
      type: initial?.type ?? 'ASSEMBLY',
      lifeCyclePhase: initial?.lifeCyclePhase ?? 'DESIGN',
      productFamily: initial?.productFamily ?? '',
    },
  });

  const submit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await onSubmit({
        itemNumber: v.itemNumber.trim(),
        itemName: v.itemName.trim(),
        description: blankToNull(v.description),
        type: v.type,
        lifeCyclePhase: v.lifeCyclePhase,
        productFamily: blankToNull(v.productFamily),
      });
    } catch (e) {
      setFormError(applyServerError(e, setError, 'itemNumber'));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-2 gap-x-4">
        <Field label="Item Number" required error={errors.itemNumber?.message}>
          <TextInput autoFocus {...register('itemNumber')} error={errors.itemNumber?.message} />
        </Field>
        <Field label="Item Name" required error={errors.itemName?.message}>
          <TextInput {...register('itemName')} error={errors.itemName?.message} />
        </Field>
        <Field label="Item Type" required error={errors.type?.message}>
          <Select {...register('type')} options={ITEM_TYPES.map((t) => ({ value: t, label: enumLabel(t) }))} />
        </Field>
        <Field label="Lifecycle Phase" required error={errors.lifeCyclePhase?.message}>
          <Select
            {...register('lifeCyclePhase')}
            options={LIFE_CYCLE_PHASES.map((p) => ({ value: p, label: enumLabel(p) }))}
          />
        </Field>
      </div>
      <Field label="Product Family" error={errors.productFamily?.message}>
        <TextInput {...register('productFamily')} error={errors.productFamily?.message} />
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <TextArea {...register('description')} />
      </Field>
      <FormActions
        submitting={isSubmitting}
        submitLabel={initial ? 'Save changes' : 'Add Item'}
        error={formError}
        onCancel={onCancel}
      />
    </form>
  );
}
