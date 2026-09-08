import React from "react";
import Modal from "./Modal";

type Props = {
  title?: string;
  data: Record<string, any> | null;
  onClose: () => void;
};

export default function ViewDetailsModal({ title = "Details", data, onClose }: Props) {
  if (!data) return null;

  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== "");

  return (
    <Modal title={title} onClose={onClose} size="lg">
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-sm text-gray-500">No details available.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {entries.map(([k, v]) => (
              <div key={k} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                <div className="text-xs text-gray-500 mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
                <div className="text-sm text-gray-900 dark:text-white break-words">{String(v)}</div>
              </div>
            ))}
          </div>
        )}
    </div>
    </Modal>
  );
}
