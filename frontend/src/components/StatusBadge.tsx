interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={status === "Active" ? "badge badge-active" : "badge badge-inactive"}>{status}</span>;
}
