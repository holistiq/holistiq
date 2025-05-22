/**
 * Chart Annotation Component
 *
 * Provides functionality to add and display annotations on the performance chart
 */
import { useState } from 'react';
import { PlusCircle, X, Edit, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

export interface Annotation {
  id: string;
  date: number; // timestamp
  label: string;
  description: string;
  color: string;
}

interface ChartAnnotationProps {
  annotations: Annotation[];
  onAddAnnotation: (annotation: Omit<Annotation, 'id'>) => void;
  onEditAnnotation: (id: string, annotation: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
}

export function ChartAnnotation({
  annotations,
  onAddAnnotation,
  onEditAnnotation,
  onDeleteAnnotation
}: Readonly<ChartAnnotationProps>) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [newAnnotation, setNewAnnotation] = useState<Partial<Annotation>>({
    date: Date.now(),
    label: '',
    description: '',
    color: '#3b82f6' // Default blue color
  });

  const colorOptions = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#ef4444', label: 'Red' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#8b5cf6', label: 'Purple' }
  ];

  const handleAddAnnotation = () => {
    if (newAnnotation.label && newAnnotation.date) {
      onAddAnnotation({
        date: newAnnotation.date,
        label: newAnnotation.label,
        description: newAnnotation.description || '',
        color: newAnnotation.color || '#3b82f6'
      });

      // Reset form
      setNewAnnotation({
        date: Date.now(),
        label: '',
        description: '',
        color: '#3b82f6'
      });

      setIsAddDialogOpen(false);
    }
  };

  const handleEditAnnotation = () => {
    if (editingAnnotation?.id) {
      onEditAnnotation(editingAnnotation.id, {
        date: editingAnnotation.date,
        label: editingAnnotation.label,
        description: editingAnnotation.description,
        color: editingAnnotation.color
      });
      setEditingAnnotation(null);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium flex items-center">
          <Flag className="h-4 w-4 mr-2" />
          Annotations
        </h4>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Annotation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Chart Annotation</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      {newAnnotation.date
                        ? format(new Date(newAnnotation.date), 'PPP')
                        : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newAnnotation.date ? new Date(newAnnotation.date) : undefined}
                      onSelect={(date) => setNewAnnotation({
                        ...newAnnotation,
                        date: date ? date.getTime() : Date.now()
                      })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={newAnnotation.label || ''}
                  onChange={(e) => setNewAnnotation({
                    ...newAnnotation,
                    label: e.target.value
                  })}
                  placeholder="e.g., Started new supplement"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newAnnotation.description || ''}
                  onChange={(e) => setNewAnnotation({
                    ...newAnnotation,
                    description: e.target.value
                  })}
                  placeholder="Add more details about this event"
                />
              </div>

              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex space-x-2">
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-6 h-6 rounded-full ${newAnnotation.color === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewAnnotation({
                        ...newAnnotation,
                        color: color.value
                      })}
                      aria-label={`Select ${color.label} color`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddAnnotation} disabled={!newAnnotation.label}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {annotations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No annotations yet. Add one to mark important events on your chart.</p>
      ) : (
        <div className="space-y-2">
          {annotations.map(annotation => (
            <div
              key={annotation.id}
              className="flex items-start justify-between p-2 rounded border bg-background"
            >
              <div className="flex items-start">
                <div
                  className="w-3 h-3 rounded-full mt-1.5 mr-2"
                  style={{ backgroundColor: annotation.color }}
                />
                <div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium">{annotation.label}</p>
                    <span className="text-xs text-muted-foreground ml-2">
                      {format(new Date(annotation.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {annotation.description && (
                    <p className="text-xs text-muted-foreground mt-1">{annotation.description}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setEditingAnnotation(annotation)}
                    >
                      <Edit className="h-3 w-3" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Annotation</DialogTitle>
                    </DialogHeader>

                    {editingAnnotation && (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-date">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start text-left font-normal"
                              >
                                {format(new Date(editingAnnotation.date), 'PPP')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={new Date(editingAnnotation.date)}
                                onSelect={(date) => setEditingAnnotation({
                                  ...editingAnnotation,
                                  date: date ? date.getTime() : editingAnnotation.date
                                })}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-label">Label</Label>
                          <Input
                            id="edit-label"
                            value={editingAnnotation.label}
                            onChange={(e) => setEditingAnnotation({
                              ...editingAnnotation,
                              label: e.target.value
                            })}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-description">Description (optional)</Label>
                          <Textarea
                            id="edit-description"
                            value={editingAnnotation.description}
                            onChange={(e) => setEditingAnnotation({
                              ...editingAnnotation,
                              description: e.target.value
                            })}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Color</Label>
                          <div className="flex space-x-2">
                            {colorOptions.map(color => (
                              <button
                                key={color.value}
                                type="button"
                                className={`w-6 h-6 rounded-full ${editingAnnotation.color === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                                style={{ backgroundColor: color.value }}
                                onClick={() => setEditingAnnotation({
                                  ...editingAnnotation,
                                  color: color.value
                                })}
                                aria-label={`Select ${color.label} color`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleEditAnnotation}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onDeleteAnnotation(annotation.id)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
