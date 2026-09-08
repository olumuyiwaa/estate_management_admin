import React, { useState } from "react";
import Modal from "./Modal";

type Props = {
  title?: string;
  initialData: Record<string, any> | null;
  fields?: string[]; // which keys to render/edit
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void> | void;
};

export default function UpdateModal({ title = "Update", initialData, fields, onClose, onSave }: Props) {
  const [form, setForm] = useState<Record<string, any>>(initialData || {});
  const [saving, setSaving] = useState(false);

  if (!initialData) return null;

  const keys = fields && fields.length > 0 ? fields : Object.keys(initialData);

  const handleSave = async () => {
    // confirmation
    if (typeof window !== "undefined") {
      const ok = window.confirm("Save changes?");
      if (!ok) return;
    }

    try {
      setSaving(true);
      await onSave(form);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (k: string) => {
    const val = form[k];
    if (typeof val === "boolean") {
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
          />
          <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
        </label>
      );
    }
    if (typeof val === "number") {
      return (
        <input
          type="number"
          value={val ?? ""}
          onChange={(e) => setForm({ ...form, [k]: e.target.value === "" ? null : Number(e.target.value) })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
        />
      );
    }
    return (
      <input
        value={form[k] ?? ""}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
      />
    );
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand-500 text-white rounded-lg">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          {keys.map((k) => (
            <div key={k}>
              <label className="block text-sm font-medium mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
              {renderInput(k)}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
