interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop">
      <div className="dialog-panel">
        <div className="dialog-copy">
          <p className="eyebrow">Confirm</p>
          <h3>{title}</h3>
          <p>{message}</p>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
