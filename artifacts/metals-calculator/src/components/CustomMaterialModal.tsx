import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Info, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomMaterial } from "@/lib/useCustomMaterials";
import { useTranslation } from "react-i18next";

type FormValues = {
  name: string;
  au: string;
  ag: string;
  pt: string;
  pd: string;
  notes: string;
};

const EMPTY_FORM: FormValues = { name: "", au: "", ag: "", pt: "", pd: "", notes: "" };

function toForm(m: CustomMaterial): FormValues {
  return {
    name: m.name,
    au: m.au.toString(),
    ag: m.ag.toString(),
    pt: m.pt.toString(),
    pd: m.pd.toString(),
    notes: m.notes,
  };
}

function validateNumber(v: string, max = 9999): string | null {
  if (v === "" || v === "0") return null;
  const n = parseFloat(v);
  if (isNaN(n) || n < 0) return "≥ 0";
  if (n > max) return `max ${max}`;
  return null;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<CustomMaterial, "id" | "createdAt">) => void;
  onDelete?: () => void;
  existing?: CustomMaterial | null;
  prefill?: {
    name?: string;
    au?: number;
    ag?: number;
    pt?: number;
    pd?: number;
    notes?: string;
  } | null;
};

export function CustomMaterialModal({ open, onOpenChange, onSave, onDelete, existing, prefill }: Props) {
  const isEdit = Boolean(existing);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (open) {
      if (existing) {
        setForm(toForm(existing));
      } else if (prefill) {
        setForm({
          name: prefill.name ?? "",
          au: prefill.au?.toString() ?? "",
          ag: prefill.ag?.toString() ?? "",
          pt: prefill.pt?.toString() ?? "",
          pd: prefill.pd?.toString() ?? "",
          notes: prefill.notes ?? "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setConfirmDelete(false);
    }
  }, [open, existing, prefill]);

  const set = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = (): boolean => {
    const errs: Partial<FormValues> = {};
    if (!form.name.trim()) errs.name = t("customMaterial.nameRequired");
    const auErr = validateNumber(form.au); if (auErr) errs.au = auErr;
    const agErr = validateNumber(form.ag); if (agErr) errs.ag = agErr;
    const ptErr = validateNumber(form.pt); if (ptErr) errs.pt = ptErr;
    const pdErr = validateNumber(form.pd); if (pdErr) errs.pd = pdErr;

    const total = [form.au, form.ag, form.pt, form.pd]
      .map((v) => parseFloat(v) || 0)
      .reduce((a, b) => a + b, 0);
    if (total > 1000) errs.au = t("customMaterial.totalExceeds");

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      au: parseFloat(form.au) || 0,
      ag: parseFloat(form.ag) || 0,
      pt: parseFloat(form.pt) || 0,
      pd: parseFloat(form.pd) || 0,
      notes: form.notes.trim(),
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete?.();
    onOpenChange(false);
  };

  const metalTotal = [form.au, form.ag, form.pt, form.pd]
    .map((v) => parseFloat(v) || 0)
    .reduce((a, b) => a + b, 0);

  const METAL_LABELS: Record<string, { name: string; color: string }> = {
    au: { name: `${t("metals.Au")} (Au)`, color: "text-yellow-500" },
    ag: { name: `${t("metals.Ag")} (Ag)`, color: "text-slate-400" },
    pt: { name: `${t("metals.Pt")} (Pt)`, color: "text-sky-400" },
    pd: { name: `${t("metals.Pd")} (Pd)`, color: "text-purple-400" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
            {isEdit ? t("customMaterial.editTitle") : t("customMaterial.addTitle")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t("customMaterial.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="cm-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("customMaterial.name")}
            </Label>
            <Input
              id="cm-name"
              placeholder={t("customMaterial.namePlaceholder")}
              value={form.name}
              onChange={set("name")}
              className={cn(errors.name && "border-destructive")}
              maxLength={80}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5" />
                {t("customMaterial.metalContent")}
              </Label>
              {metalTotal > 0 && (
                <Badge variant="outline" className={cn(
                  "text-xs font-mono",
                  metalTotal > 1000 ? "border-destructive text-destructive" : "border-muted-foreground text-muted-foreground"
                )}>
                  Σ {metalTotal.toFixed(2)} g/kg
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["au", "ag", "pt", "pd"] as const).map((metal) => {
                const { name, color } = METAL_LABELS[metal]!;
                return (
                  <div key={metal} className="space-y-1">
                    <Label htmlFor={`cm-${metal}`} className={cn("text-xs font-semibold", color)}>
                      {name}
                    </Label>
                    <div className="relative">
                      <Input
                        id={`cm-${metal}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form[metal]}
                        onChange={set(metal)}
                        className={cn(
                          "pr-10 font-mono",
                          metal === "au" && errors.au ? "border-destructive" : "",
                        )}
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        g/kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.au && (
              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />{errors.au}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cm-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("customMaterial.notes")}
            </Label>
            <Textarea
              id="cm-notes"
              placeholder={t("customMaterial.notesPlaceholder")}
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              maxLength={300}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          {isEdit && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="sm:mr-auto"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {confirmDelete ? t("customMaterial.confirmDelete") : t("customMaterial.delete")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("customMaterial.cancel")}
          </Button>
          <Button size="sm" onClick={handleSave}>
            {isEdit ? t("customMaterial.save") : t("customMaterial.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
