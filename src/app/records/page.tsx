"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Clock, Pill, Dumbbell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addExerciseEntry,
  addInsulinEntry,
  addMedicationEntry,
  getRecordsPageData,
  saveSleepData,
} from "@/app/actions";
import { useEffect, useState, useTransition } from "react";
import type {
  HealthData,
  SleepData,
} from "@/lib/health-data";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

const mockRecords = [
  {
    id: "REC001",
    type: "Annual Check-up",
    date: "2024-03-15",
    doctor: "Dr. Evelyn Reed",
    status: "Completed",
  },
  {
    id: "REC002",
    type: "Blood Test",
    date: "2024-03-18",
    doctor: "LabCorp",
    status: "Results Ready",
  },
  {
    id: "REC003",
    type: "Dental Cleaning",
    date: "2024-04-02",
    doctor: "Dr. Ben Carter",
    status: "Completed",
  },
  {
    id: "REC004",
    type: "Specialist Consultation",
    date: "2024-04-20",
    doctor: "Dr. Olivia Chen",
    status: "Scheduled",
  },
  {
    id: "REC005",
    type: "Flu Shot",
    date: "2023-10-05",
    doctor: "City Pharmacy",
    status: "Completed",
  },
  {
    id: "REC006",
    type: "X-Ray",
    date: "2024-05-01",
    doctor: "Radiology Associates",
    status: "Awaiting Results",
  },
];

const weekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export default function RecordsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [healthData, setHealthData] = useState<HealthData>({
    sleep: {},
    insulin: [],
    medication: [],
    exercise: [],
  });
  const [sleepHours, setSleepHours] = useState<SleepData>({});
  const [insulinEntry, setInsulinEntry] = useState({ time: "", dosage: "" });
  const [medicationEntry, setMedicationEntry] = useState({ name: "", time: "" });
  const [exerciseEntry, setExerciseEntry] = useState({ type: "", duration: "" });

  const fetchHealthData = () => {
    startTransition(() => {
        getRecordsPageData().then((data) => {
            setHealthData(data);
            setSleepHours(data.sleep || {});
            router.refresh();
        });
    })
  }

  useEffect(() => {
    getRecordsPageData().then((data) => {
      setHealthData(data);
      setSleepHours(data.sleep || {});
    });
  }, []);

  const handleSaveSleep = () => {
    startTransition(async () => {
      await saveSleepData(sleepHours);
      fetchHealthData();
    });
  };

  const handleAddInsulin = () => {
    if (!insulinEntry.time || !insulinEntry.dosage) return;
    startTransition(async () => {
      await addInsulinEntry(insulinEntry);
      setInsulinEntry({ time: "", dosage: "" });
      fetchHealthData();
    });
  };

  const handleAddMedication = () => {
    if (!medicationEntry.name || !medicationEntry.time) return;
    startTransition(async () => {
      await addMedicationEntry(medicationEntry);
      setMedicationEntry({ name: "", time: "" });
      fetchHealthData();
    });
  };

  const handleAddExercise = () => {
    if (!exerciseEntry.type || !exerciseEntry.duration) return;
    startTransition(async () => {
      await addExerciseEntry(exerciseEntry);
      setExerciseEntry({ type: "", duration: "" });
      fetchHealthData();
    });
  };

  return (
    <main className="flex-1 p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Your Health Log</h1>
        <Button>
          <RefreshCw className="mr-2" />
          Sync Data from Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Sleep Log</CardTitle>
            <CardDescription>
              Track your sleep hours for the week.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weekDays.map((day) => (
              <div key={day} className="flex items-center justify-between gap-4">
                <Label htmlFor={`sleep-${day}`} className="w-28 capitalize">
                  {day}
                </Label>
                <Input
                  id={`sleep-${day}`}
                  type="number"
                  placeholder="Hours"
                  className="flex-1"
                  value={sleepHours[day] || ""}
                  onChange={(e) =>
                    setSleepHours({ ...sleepHours, [day]: e.target.value })
                  }
                  disabled={isPending}
                />
              </div>
            ))}
            <Button
              className="w-full mt-2"
              onClick={handleSaveSleep}
              disabled={isPending}
            >
              <Plus className="mr-2" /> Save Sleep Data
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Insulin Log</CardTitle>
            <CardDescription>
              Record your insulin dosages and times.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <div className="flex gap-4">
              <div className="w-1/2 space-y-2">
                <Label htmlFor="insulin-time">Time</Label>
                <Input
                  id="insulin-time"
                  type="time"
                  value={insulinEntry.time}
                  onChange={(e) =>
                    setInsulinEntry({ ...insulinEntry, time: e.target.value })
                  }
                  disabled={isPending}
                />
              </div>
              <div className="w-1/2 space-y-2">
                <Label htmlFor="insulin-dosage">Dosage (units)</Label>
                <Input
                  id="insulin-dosage"
                  type="number"
                  placeholder="e.g., 10"
                  value={insulinEntry.dosage}
                  onChange={(e) =>
                    setInsulinEntry({
                      ...insulinEntry,
                      dosage: e.target.value,
                    })
                  }
                  disabled={isPending}
                />
              </div>
            </div>
            <Button
              className="w-full mt-2"
              onClick={handleAddInsulin}
              disabled={isPending}
            >
              <Plus className="mr-2" /> Add Insulin Entry
            </Button>
            <Separator className="my-4" />
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Recent Entries
            </h3>
            <ScrollArea className="h-32">
              <div className="space-y-2 pr-4">
                {healthData.insulin && healthData.insulin.length > 0 ? (
                  healthData.insulin.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{entry.time}</span>
                      </div>
                      <span>{entry.dosage} units</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    No insulin entries yet.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Medication Log</CardTitle>
            <CardDescription>
              Keep track of your medication schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <div className="flex gap-4">
              <div className="w-1/2 space-y-2">
                <Label htmlFor="med-name">Medication</Label>
                <Input
                  id="med-name"
                  placeholder="e.g., Metformin"
                  value={medicationEntry.name}
                  onChange={(e) =>
                    setMedicationEntry({
                      ...medicationEntry,
                      name: e.target.value,
                    })
                  }
                  disabled={isPending}
                />
              </div>
              <div className="w-1/2 space-y-2">
                <Label htmlFor="med-time">Time Taken</Label>
                <Input
                  id="med-time"
                  type="time"
                  value={medicationEntry.time}
                  onChange={(e) =>
                    setMedicationEntry({
                      ...medicationEntry,
                      time: e.target.value,
                    })
                  }
                  disabled={isPending}
                />
              </div>
            </div>
            <Button
              className="w-full mt-2"
              onClick={handleAddMedication}
              disabled={isPending}
            >
              <Plus className="mr-2" /> Add Medication Entry
            </Button>
            <Separator className="my-4" />
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Recent Entries
            </h3>
            <ScrollArea className="h-32">
            <div className="space-y-2 pr-4">
                {healthData.medication && healthData.medication.length > 0 ? (
                  healthData.medication.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        <span>{entry.name}</span>
                      </div>
                      <span>{entry.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    No medication entries yet.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Exercise Log</CardTitle>
            <CardDescription>Log your physical activities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <div className="flex gap-4">
              <div className="w-1/2 space-y-2">
                <Label htmlFor="exercise-type">Activity</Label>
                <Input
                  id="exercise-type"
                  placeholder="e.g., Running"
                  value={exerciseEntry.type}
                  onChange={(e) =>
                    setExerciseEntry({
                      ...exerciseEntry,
                      type: e.target.value,
                    })
                  }
                  disabled={isPending}
                />
              </div>
              <div className="w-1/2 space-y-2">
                <Label htmlFor="exercise-duration">Duration (minutes)</Label>
                <Input
                  id="exercise-duration"
                  type="number"
                  placeholder="e.g., 30"
                  value={exerciseEntry.duration}
                  onChange={(e) =>
                    setExerciseEntry({
                      ...exerciseEntry,
                      duration: e.target.value,
                    })
                  }
                  disabled={isPending}
                />
              </div>
            </div>
            <Button
              className="w-full mt-2"
              onClick={handleAddExercise}
              disabled={isPending}
            >
              <Plus className="mr-2" /> Add Exercise Entry
            </Button>
            <Separator className="my-4" />
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Recent Entries
            </h3>
            <ScrollArea className="h-32">
            <div className="space-y-2 pr-4">
                {healthData.exercise && healthData.exercise.length > 0 ? (
                  healthData.exercise.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4" />
                        <span>{entry.activity || entry.type}</span>
                      </div>
                      <span>{entry.duration} mins</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    No exercise entries yet.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Official Health Records</CardTitle>
          <CardDescription>
            A summary of your recent medical records and appointments from your
            provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.doctor}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        record.status === "Completed"
                          ? "secondary"
                          : record.status.includes("Result")
                          ? "default"
                          : "outline"
                      }
                      className={
                        record.status.includes("Result")
                          ? "bg-primary/80 text-primary-foreground"
                          : ""
                      }
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
