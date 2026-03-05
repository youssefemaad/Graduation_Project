"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Loader2,
  Scale,
  Activity,
  Droplets,
  Flame,
  Heart,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/gym";
import {
  inbodyApi,
  type InBodyMeasurementDto,
  type CreateInBodyMeasurementDto,
} from "@/lib/api";
import { receptionApi, type MemberSearchDto } from "@/lib/api/reception";

// ---------- types ----------
interface FormData {
  weight: string;
  height: string;
  bodyFatPercentage: string;
  muscleMass: string;
  bodyWaterPercentage: string;
  protein: string;
  minerals: string;
  visceralFat: string;
  bmr: string;
  metabolicAge: string;
  bodyType: string;
  // segmental
  segmentalRightArmLean: string;
  segmentalRightArmFat: string;
  segmentalLeftArmLean: string;
  segmentalLeftArmFat: string;
  segmentalTrunkLean: string;
  segmentalTrunkFat: string;
  segmentalRightLegLean: string;
  segmentalRightLegFat: string;
  segmentalLeftLegLean: string;
  segmentalLeftLegFat: string;
  notes: string;
}

const emptyForm: FormData = {
  weight: "",
  height: "",
  bodyFatPercentage: "",
  muscleMass: "",
  bodyWaterPercentage: "",
  protein: "",
  minerals: "",
  visceralFat: "",
  bmr: "",
  metabolicAge: "",
  bodyType: "",
  segmentalRightArmLean: "",
  segmentalRightArmFat: "",
  segmentalLeftArmLean: "",
  segmentalLeftArmFat: "",
  segmentalTrunkLean: "",
  segmentalTrunkFat: "",
  segmentalRightLegLean: "",
  segmentalRightLegFat: "",
  segmentalLeftLegLean: "",
  segmentalLeftLegFat: "",
  notes: "",
};

// helper: parse to number or undefined
const num = (v: string): number | undefined => {
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
};
const int = (v: string): number | undefined => {
  const n = parseInt(v, 10);
  return isNaN(n) ? undefined : n;
};

// ---------- component ----------
function ReceptionInBodyContent() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // member search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearchDto[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberSearchDto | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // measurements for selected member
  const [measurements, setMeasurements] = useState<InBodyMeasurementDto[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  // new measurement dialog
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSegmental, setShowSegmental] = useState(false);

  // view measurement dialog
  const [viewMeasurement, setViewMeasurement] =
    useState<InBodyMeasurementDto | null>(null);

  // --- search ---
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await receptionApi.searchMembers(searchQuery.trim());
        if (res.success && res.data) setSearchResults(res.data);
      } catch {
        /* ignore */
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  // --- load measurements when member selected ---
  useEffect(() => {
    if (!selectedMember) {
      setMeasurements([]);
      return;
    }
    (async () => {
      setLoadingMeasurements(true);
      try {
        const res = await inbodyApi.getUserMeasurements(selectedMember.userId);
        if (res.success && res.data) setMeasurements(res.data);
      } catch {
        /* ignore */
      } finally {
        setLoadingMeasurements(false);
      }
    })();
  }, [selectedMember]);

  const selectMember = (m: MemberSearchDto) => {
    setSelectedMember(m);
    setSearchQuery("");
    setSearchResults([]);
  };

  // --- form helpers ---
  const handleField = (field: keyof FormData, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const openNewMeasurement = () => {
    setFormData(emptyForm);
    setShowSegmental(false);
    setShowNewDialog(true);
  };

  const submitMeasurement = async () => {
    if (!selectedMember) return;
    if (!formData.weight || !formData.height) {
      showToast("Weight and Height are required", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const dto: CreateInBodyMeasurementDto = {
        userId: selectedMember.userId,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        bodyFatPercentage: num(formData.bodyFatPercentage),
        muscleMass: num(formData.muscleMass),
        bodyWaterPercentage: num(formData.bodyWaterPercentage),
        protein: num(formData.protein),
        minerals: num(formData.minerals),
        visceralFat: num(formData.visceralFat),
        bmr: num(formData.bmr),
        metabolicAge: int(formData.metabolicAge),
        bodyType: formData.bodyType || undefined,
        segmentalRightArmLean: num(formData.segmentalRightArmLean),
        segmentalRightArmFat: num(formData.segmentalRightArmFat),
        segmentalLeftArmLean: num(formData.segmentalLeftArmLean),
        segmentalLeftArmFat: num(formData.segmentalLeftArmFat),
        segmentalTrunkLean: num(formData.segmentalTrunkLean),
        segmentalTrunkFat: num(formData.segmentalTrunkFat),
        segmentalRightLegLean: num(formData.segmentalRightLegLean),
        segmentalRightLegFat: num(formData.segmentalRightLegFat),
        segmentalLeftLegLean: num(formData.segmentalLeftLegLean),
        segmentalLeftLegFat: num(formData.segmentalLeftLegFat),
        conductedByReceptionId: user?.userId,
        notes: formData.notes || undefined,
      };

      const res = await inbodyApi.createMeasurement(dto);
      if (res.success && res.data) {
        showToast("InBody measurement saved successfully!", "success");
        setShowNewDialog(false);
        // reload
        setMeasurements((prev) => [res.data!, ...prev]);
      } else {
        showToast(res.message || "Failed to save measurement", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save measurement", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- compute comparison ---
  const getComparison = (
    current: number | undefined,
    previous: number | undefined,
  ) => {
    if (current == null || previous == null || previous === 0) return null;
    const diff = ((current - previous) / previous) * 100;
    return diff;
  };

  const latest = measurements[0] ?? null;
  const previous = measurements[1] ?? null;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">InBody Measurements</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Record and track member body composition
          </p>
        </div>
      </div>

      {/* Search member */}
      <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
        <Label className="text-sm font-medium text-muted-foreground mb-2 block">
          Search Member
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or member number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}

          {/* dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((m) => (
                <button
                  key={m.userId}
                  onClick={() => selectMember(m)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.memberNumber} {m.email && `· ${m.email}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      m.isActive
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {m.isActive ? "Active" : "Inactive"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* selected member chip */}
        {selectedMember && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {selectedMember.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="font-medium">{selectedMember.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedMember.memberNumber}
              </p>
            </div>
            <Button size="sm" onClick={openNewMeasurement}>
              <Plus className="h-4 w-4 mr-1" /> New Measurement
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedMember(null);
                setMeasurements([]);
              }}
              className="text-muted-foreground"
            >
              Change
            </Button>
          </div>
        )}
      </Card>

      {/* Results area */}
      {selectedMember && (
        <>
          {loadingMeasurements ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : measurements.length === 0 ? (
            <Card className="p-12 text-center border border-border bg-card/50">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No Measurements Yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Click &quot;New Measurement&quot; to record the first InBody
                scan for {selectedMember.name}.
              </p>
            </Card>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <SummaryCard
                  icon={<Scale className="h-4 w-4" />}
                  label="TOTAL WEIGHT"
                  value={latest?.weight}
                  unit="kg"
                  comparison={getComparison(latest?.weight, previous?.weight)}
                  comparisonLabel="vs last"
                />
                <SummaryCard
                  icon={<Activity className="h-4 w-4" />}
                  label="MUSCLE MASS"
                  value={latest?.muscleMass}
                  unit="kg"
                  comparison={getComparison(
                    latest?.muscleMass,
                    previous?.muscleMass,
                  )}
                  comparisonLabel="Improved"
                />
                <SummaryCard
                  icon={<Flame className="h-4 w-4" />}
                  label="BODY FAT"
                  value={latest?.bodyFatPercentage}
                  unit="%"
                  comparison={getComparison(
                    latest?.bodyFatPercentage,
                    previous?.bodyFatPercentage,
                  )}
                  comparisonLabel="Leaner"
                  invertColor
                />
              </div>

              {/* Detail cards row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricCard
                  icon={<Heart className="h-4 w-4 text-yellow-500" />}
                  label="BMI"
                  value={latest?.bmi?.toFixed(1)}
                  sub={getBmiLabel(latest?.bmi)}
                />
                <MetricCard
                  icon={<Droplets className="h-4 w-4 text-blue-500" />}
                  label="BODY WATER"
                  value={latest?.bodyWaterPercentage?.toFixed(0)}
                  sub="Pct %"
                />
                <MetricCard
                  icon={<FileText className="h-4 w-4 text-green-500" />}
                  label="PROTEIN"
                  value={
                    latest?.protein != null ? latest.protein.toFixed(1) : "--"
                  }
                  sub="kg"
                />
                <MetricCard
                  icon={<FileText className="h-4 w-4 text-purple-500" />}
                  label="MINERALS"
                  value={
                    latest?.minerals != null ? latest.minerals.toFixed(1) : "--"
                  }
                  sub="kg"
                />
                <MetricCard
                  icon={<Flame className="h-4 w-4 text-red-500" />}
                  label="VISCERAL FAT"
                  value={latest?.visceralFat?.toFixed(0)}
                  sub="Level"
                />
                <MetricCard
                  icon={<Activity className="h-4 w-4 text-orange-500" />}
                  label="BMR"
                  value={latest?.bmr?.toFixed(0)}
                  sub="kcal"
                />
              </div>

              {/* Segmental lean analysis */}
              {hasSegmental(latest) && (
                <Card className="p-6 border border-border bg-card/50">
                  <h3 className="text-lg font-semibold mb-4">
                    Segmental Lean Analysis
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-xs uppercase border-b border-border">
                          <th className="py-2 text-left">Segment</th>
                          <th className="py-2 text-center">Lean</th>
                          <th className="py-2 text-center">Fat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            name: "Right Arm",
                            lean: latest?.segmentalRightArmLean,
                            fat: latest?.segmentalRightArmFat,
                          },
                          {
                            name: "Left Arm",
                            lean: latest?.segmentalLeftArmLean,
                            fat: latest?.segmentalLeftArmFat,
                          },
                          {
                            name: "Trunk",
                            lean: latest?.segmentalTrunkLean,
                            fat: latest?.segmentalTrunkFat,
                          },
                          {
                            name: "Right Leg",
                            lean: latest?.segmentalRightLegLean,
                            fat: latest?.segmentalRightLegFat,
                          },
                          {
                            name: "Left Leg",
                            lean: latest?.segmentalLeftLegLean,
                            fat: latest?.segmentalLeftLegFat,
                          },
                        ].map((s) => (
                          <tr
                            key={s.name}
                            className="border-b border-border/50"
                          >
                            <td className="py-2 font-medium">{s.name}</td>
                            <td className="py-2 text-center text-primary">
                              {s.lean != null ? s.lean.toFixed(1) : "--"}
                            </td>
                            <td className="py-2 text-center">
                              {s.fat != null ? s.fat.toFixed(1) : "--"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* History */}
              <Card className="p-6 border border-border bg-card/50">
                <h3 className="text-lg font-semibold mb-4">
                  Measurement History
                </h3>
                <div className="space-y-3">
                  {measurements.map((m) => (
                    <div
                      key={m.measurementId}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setViewMeasurement(m)}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Scale className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {new Date(m.measurementDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.conductedByName ? `By ${m.conductedByName}` : ""}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Weight
                          </p>
                          <p className="font-semibold">{m.weight} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Muscle
                          </p>
                          <p className="font-semibold">
                            {m.muscleMass ?? "--"} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fat</p>
                          <p className="font-semibold">
                            {m.bodyFatPercentage ?? "--"}%
                          </p>
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* ========== NEW MEASUREMENT DIALOG ========== */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New InBody Measurement</DialogTitle>
            <DialogDescription>
              Enter the InBody scan results for {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Required */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Weight (kg) *"
                value={formData.weight}
                onChange={(v) => handleField("weight", v)}
                type="number"
                placeholder="79"
              />
              <FormField
                label="Height (cm) *"
                value={formData.height}
                onChange={(v) => handleField("height", v)}
                type="number"
                placeholder="175"
              />
            </div>

            {/* Body composition */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Body Composition
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  label="Body Fat %"
                  value={formData.bodyFatPercentage}
                  onChange={(v) => handleField("bodyFatPercentage", v)}
                  type="number"
                  placeholder="17"
                />
                <FormField
                  label="Muscle Mass (kg)"
                  value={formData.muscleMass}
                  onChange={(v) => handleField("muscleMass", v)}
                  type="number"
                  placeholder="38"
                />
                <FormField
                  label="Body Water (%)"
                  value={formData.bodyWaterPercentage}
                  onChange={(v) => handleField("bodyWaterPercentage", v)}
                  type="number"
                  placeholder="59"
                />
                <FormField
                  label="Protein (kg)"
                  value={formData.protein}
                  onChange={(v) => handleField("protein", v)}
                  type="number"
                  placeholder="12.5"
                />
                <FormField
                  label="Minerals (kg)"
                  value={formData.minerals}
                  onChange={(v) => handleField("minerals", v)}
                  type="number"
                  placeholder="3.5"
                />
                <FormField
                  label="Visceral Fat Level"
                  value={formData.visceralFat}
                  onChange={(v) => handleField("visceralFat", v)}
                  type="number"
                  placeholder="5"
                />
              </div>
            </div>

            {/* Metabolic */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Metabolic
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  label="BMR (kcal)"
                  value={formData.bmr}
                  onChange={(v) => handleField("bmr", v)}
                  type="number"
                  placeholder="1890"
                />
                <FormField
                  label="Metabolic Age"
                  value={formData.metabolicAge}
                  onChange={(v) => handleField("metabolicAge", v)}
                  type="number"
                  placeholder="25"
                />
                <FormField
                  label="Body Type"
                  value={formData.bodyType}
                  onChange={(v) => handleField("bodyType", v)}
                  placeholder="e.g. Muscular"
                />
              </div>
            </div>

            {/* Segmental (collapsible) */}
            <div>
              <button
                type="button"
                onClick={() => setShowSegmental(!showSegmental)}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
              >
                Segmental Lean Analysis
                {showSegmental ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showSegmental && (
                <div className="mt-3 space-y-3">
                  {[
                    {
                      label: "Right Arm",
                      leanKey: "segmentalRightArmLean" as keyof FormData,
                      fatKey: "segmentalRightArmFat" as keyof FormData,
                    },
                    {
                      label: "Left Arm",
                      leanKey: "segmentalLeftArmLean" as keyof FormData,
                      fatKey: "segmentalLeftArmFat" as keyof FormData,
                    },
                    {
                      label: "Trunk",
                      leanKey: "segmentalTrunkLean" as keyof FormData,
                      fatKey: "segmentalTrunkFat" as keyof FormData,
                    },
                    {
                      label: "Right Leg",
                      leanKey: "segmentalRightLegLean" as keyof FormData,
                      fatKey: "segmentalRightLegFat" as keyof FormData,
                    },
                    {
                      label: "Left Leg",
                      leanKey: "segmentalLeftLegLean" as keyof FormData,
                      fatKey: "segmentalLeftLegFat" as keyof FormData,
                    },
                  ].map((seg) => (
                    <div
                      key={seg.label}
                      className="grid grid-cols-3 gap-3 items-center"
                    >
                      <span className="text-sm font-medium">{seg.label}</span>
                      <FormField
                        label="Lean"
                        value={formData[seg.leanKey]}
                        onChange={(v) => handleField(seg.leanKey, v)}
                        type="number"
                        placeholder="--"
                        compact
                      />
                      <FormField
                        label="Fat"
                        value={formData[seg.fatKey]}
                        onChange={(v) => handleField(seg.fatKey, v)}
                        type="number"
                        placeholder="--"
                        compact
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleField("notes", e.target.value)}
                placeholder="Any additional observations..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={submitMeasurement} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" /> Save Measurement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== VIEW MEASUREMENT DIALOG ========== */}
      <Dialog
        open={!!viewMeasurement}
        onOpenChange={() => setViewMeasurement(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Measurement Details</DialogTitle>
            <DialogDescription>
              {viewMeasurement &&
                new Date(viewMeasurement.measurementDate).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
            </DialogDescription>
          </DialogHeader>
          {viewMeasurement && (
            <div className="space-y-6 py-4">
              {/* Basic */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ViewField
                  label="Weight"
                  value={`${viewMeasurement.weight} kg`}
                />
                <ViewField
                  label="Height"
                  value={`${viewMeasurement.height} cm`}
                />
                <ViewField
                  label="BMI"
                  value={viewMeasurement.bmi?.toFixed(1)}
                  sub={getBmiLabel(viewMeasurement.bmi)}
                />
              </div>
              {/* Composition */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ViewField
                  label="Body Fat"
                  value={
                    viewMeasurement.bodyFatPercentage != null
                      ? `${viewMeasurement.bodyFatPercentage}%`
                      : undefined
                  }
                />
                <ViewField
                  label="Muscle Mass"
                  value={
                    viewMeasurement.muscleMass != null
                      ? `${viewMeasurement.muscleMass} kg`
                      : undefined
                  }
                />
                <ViewField
                  label="Body Water"
                  value={
                    viewMeasurement.bodyWaterPercentage != null
                      ? `${viewMeasurement.bodyWaterPercentage}%`
                      : undefined
                  }
                />
                <ViewField
                  label="Protein"
                  value={
                    viewMeasurement.protein != null
                      ? `${viewMeasurement.protein} kg`
                      : undefined
                  }
                />
                <ViewField
                  label="Minerals"
                  value={
                    viewMeasurement.minerals != null
                      ? `${viewMeasurement.minerals} kg`
                      : undefined
                  }
                />
                <ViewField
                  label="Visceral Fat"
                  value={
                    viewMeasurement.visceralFat != null
                      ? `Level ${viewMeasurement.visceralFat}`
                      : undefined
                  }
                />
              </div>
              {/* Metabolic */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ViewField
                  label="BMR"
                  value={
                    viewMeasurement.bmr != null
                      ? `${viewMeasurement.bmr} kcal`
                      : undefined
                  }
                />
                <ViewField
                  label="Metabolic Age"
                  value={viewMeasurement.metabolicAge?.toString()}
                />
                <ViewField label="Body Type" value={viewMeasurement.bodyType} />
              </div>
              {/* Segmental */}
              {hasSegmental(viewMeasurement) && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase">
                    Segmental Analysis
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground uppercase border-b border-border">
                          <th className="py-2 text-left">Segment</th>
                          <th className="py-2 text-center">Lean</th>
                          <th className="py-2 text-center">Fat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            name: "Right Arm",
                            lean: viewMeasurement.segmentalRightArmLean,
                            fat: viewMeasurement.segmentalRightArmFat,
                          },
                          {
                            name: "Left Arm",
                            lean: viewMeasurement.segmentalLeftArmLean,
                            fat: viewMeasurement.segmentalLeftArmFat,
                          },
                          {
                            name: "Trunk",
                            lean: viewMeasurement.segmentalTrunkLean,
                            fat: viewMeasurement.segmentalTrunkFat,
                          },
                          {
                            name: "Right Leg",
                            lean: viewMeasurement.segmentalRightLegLean,
                            fat: viewMeasurement.segmentalRightLegFat,
                          },
                          {
                            name: "Left Leg",
                            lean: viewMeasurement.segmentalLeftLegLean,
                            fat: viewMeasurement.segmentalLeftLegFat,
                          },
                        ].map((s) => (
                          <tr
                            key={s.name}
                            className="border-b border-border/50"
                          >
                            <td className="py-2 font-medium">{s.name}</td>
                            <td className="py-2 text-center text-primary">
                              {s.lean != null ? s.lean.toFixed(1) : "--"}
                            </td>
                            <td className="py-2 text-center">
                              {s.fat != null ? s.fat.toFixed(1) : "--"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Notes & conductor */}
              {viewMeasurement.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1 uppercase">
                    Notes
                  </h4>
                  <p className="text-sm">{viewMeasurement.notes}</p>
                </div>
              )}
              {viewMeasurement.conductedByName && (
                <p className="text-xs text-muted-foreground">
                  Conducted by: {viewMeasurement.conductedByName}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== Sub-components ====================

function SummaryCard({
  icon,
  label,
  value,
  unit,
  comparison,
  comparisonLabel,
  invertColor,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  unit: string;
  comparison: number | null;
  comparisonLabel: string;
  invertColor?: boolean;
}) {
  const isPositive = comparison != null && comparison > 0;
  const color = invertColor
    ? isPositive
      ? "text-red-500"
      : "text-green-500"
    : isPositive
      ? "text-green-500"
      : "text-red-500";

  return (
    <Card className="p-5 border border-border bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="text-3xl font-bold">
        {value != null ? value : "--"}
        <span className="text-base font-normal text-muted-foreground ml-1">
          {unit}
        </span>
      </p>
      {comparison != null && (
        <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${invertColor ? (isPositive ? "bg-red-500" : "bg-green-500") : isPositive ? "bg-green-500" : "bg-red-500"} w-[${Math.min(Math.abs(comparison) * 10, 100)}%]`}
          />
        </div>
      )}
      {comparison != null && (
        <p className={`text-xs mt-1 ${color}`}>
          {Math.abs(comparison).toFixed(1)}% {comparisonLabel}
        </p>
      )}
    </Card>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  sub?: string;
}) {
  return (
    <Card className="p-4 border border-border bg-card/50">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold">{value ?? "--"}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function FormField({
  label,
  value,
  onChange,
  type,
  placeholder,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <div>
      {!compact && (
        <Label className="text-sm font-medium mb-1 block">{label}</Label>
      )}
      <Input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={compact ? "h-8 text-sm" : ""}
      />
    </div>
  );
}

function ViewField({
  label,
  value,
  sub,
}: {
  label: string;
  value?: string;
  sub?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value ?? "--"}</p>
      {sub && <p className="text-xs text-yellow-500">{sub}</p>}
    </div>
  );
}

function getBmiLabel(bmi?: number): string | undefined {
  if (bmi == null) return undefined;
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "High";
  return "Obese";
}

function hasSegmental(m: InBodyMeasurementDto | null): boolean {
  if (!m) return false;
  return [
    m.segmentalRightArmLean,
    m.segmentalRightArmFat,
    m.segmentalLeftArmLean,
    m.segmentalLeftArmFat,
    m.segmentalTrunkLean,
    m.segmentalTrunkFat,
    m.segmentalRightLegLean,
    m.segmentalRightLegFat,
    m.segmentalLeftLegLean,
    m.segmentalLeftLegFat,
  ].some((v) => v != null);
}

// ==================== Page export ====================
export default function ReceptionInBodyPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist, UserRole.Admin]}>
      <ReceptionInBodyContent />
    </ProtectedRoute>
  );
}
