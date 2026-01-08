import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Camera, CheckCircle2, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScreenshotUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    title: string;
    description: string;
    points_reward: number;
    external_url?: string | null;
  };
  userId: string;
  onSuccess: () => void;
}

export const ScreenshotUploadDialog = ({
  open,
  onOpenChange,
  task,
  userId,
  onSuccess,
}: ScreenshotUploadDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a screenshot");
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${userId}/${task.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task-screenshots")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("task-screenshots")
        .getPublicUrl(fileName);

      const screenshotUrl = urlData.publicUrl;

      // Create user_task record with pending status
      const { error: taskError } = await supabase.from("user_tasks").upsert(
        {
          user_id: userId,
          task_id: task.id,
          status: "pending",
          screenshot_url: screenshotUrl,
          points_awarded: 0,
        },
        { onConflict: "user_id,task_id" }
      );

      if (taskError) throw taskError;

      toast.success("Screenshot submitted for review!");
      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload screenshot");
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Screenshot Verification
          </DialogTitle>
          <DialogDescription>
            Upload a screenshot proving you completed this task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Info */}
          <div className="glass-card p-3 border-border">
            <h4 className="font-medium text-foreground text-sm">{task.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
            <p className="text-xs text-accent font-medium mt-2">
              Reward: +{task.points_reward} ARX-P
            </p>
          </div>

          {/* Upload Area */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="screenshot-upload"
            />

            {previewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={previewUrl}
                  alt="Screenshot preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={resetState}
                  className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="screenshot-upload"
                className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload screenshot
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WEBP up to 5MB
                </p>
              </label>
            )}
          </div>

          {/* Requirements */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs font-medium text-foreground mb-2">
              Screenshot Requirements:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <span>Must clearly show the completed action</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <span>No editing or cropping to hide information</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <span>Submitted once = permanently verified</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              className="flex-1 btn-mining"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
