import { FormEvent, useEffect, useState } from "react";
import { Vendor } from "../../types";

interface ProfileTabProps {
  vendor: Vendor;
  onSave: (payload: Partial<Vendor>) => Promise<unknown>;
}

export default function ProfileTab({ vendor, onSave }: ProfileTabProps) {
  const [form, setForm] = useState({
    business_name: vendor.business_name,
    logo_url: vendor.logo_url ?? "",
    location: vendor.location ?? "",
    hours: vendor.hours ?? "",
    prep_time: vendor.prep_time ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setForm({
      business_name: vendor.business_name,
      logo_url: vendor.logo_url ?? "",
      location: vendor.location ?? "",
      hours: vendor.hours ?? "",
      prep_time: vendor.prep_time ?? "",
    });
  }, [vendor]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof typeof form, label: string, placeholder: string) {
    return (
      <div>
        <label className="block text-sm text-neutral-300 mb-1.5">{label}</label>
        <input
          type="text"
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full h-12 px-4 text-base rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {field("business_name", "Business name", "Ghana Kitchen")}
      {field("logo_url", "Logo URL", "https://...")}
      {field("location", "Location", "Osu, Accra")}
      {field("hours", "Hours", "9:00 AM - 9:00 PM")}
      {field("prep_time", "Prep time", "20-30 min")}

      <button
        type="submit"
        disabled={saving}
        className="h-12 px-6 rounded-xl bg-red-600 text-white font-semibold text-base active:scale-[0.98] transition disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>

      {savedAt && <p className="text-sm text-red-500">Saved.</p>}
    </form>
  );
}
