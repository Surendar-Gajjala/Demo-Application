export interface EntityFormProps<T, R> {
  /** Existing record when editing; undefined when adding. */
  initial?: T;
  /** Resolves on success; rejects with ApiError on failure. */
  onSubmit: (request: R) => Promise<void>;
  onCancel: () => void;
}
