
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogSupplement() {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate saving to database
    setTimeout(() => {
      // In a real app, this would be saved to a database
      const supplement = {
        id: Date.now(),
        name,
        dosage,
        notes,
        lastTaken: new Date().toISOString(),
      };
      
      // For demo, just save to localStorage
      const existingSupplements = JSON.parse(localStorage.getItem("supplements") || "[]");
      localStorage.setItem("supplements", JSON.stringify([...existingSupplements, supplement]));
      
      navigate("/dashboard");
    }, 1000);
  };
  
  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Log Supplement</CardTitle>
          <CardDescription>
            Record a supplement you're taking to track its effects.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplement Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Alpha GPC, Lion's Mane, etc."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 300mg, 1000mg, etc."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details about timing, brand, etc."
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col w-full gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Supplement"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
