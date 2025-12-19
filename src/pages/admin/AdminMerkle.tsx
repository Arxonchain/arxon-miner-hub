import { useState } from "react";
import { Upload, FileCheck, Shield, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const AdminMerkle = () => {
  const [restrictToEligible, setRestrictToEligible] = useState(true);
  const [testProof, setTestProof] = useState("");
  const [verificationResult, setVerificationResult] = useState<"valid" | "invalid" | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: "File Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  const handleGenerateProofs = () => {
    toast({
      title: "Generating Proofs",
      description: "Merkle proofs are being generated for all eligible addresses.",
    });
  };

  const handleTestProof = () => {
    // Mock verification
    const isValid = testProof.startsWith("0x") && testProof.length > 10;
    setVerificationResult(isValid ? "valid" : "invalid");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Merkle / Eligibility</h1>
        <p className="text-muted-foreground">Manage whitelist and merkle proof verification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Whitelist */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Whitelist
          </h3>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground font-medium">Drop your file here</p>
              <p className="text-sm text-muted-foreground">Supports CSV and JSON formats</p>
            </div>
            <Label htmlFor="file-upload">
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" asChild>
                <span>Browse Files</span>
              </Button>
            </Label>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Uploading a new whitelist will replace the existing one. Make sure to backup your current data.
            </p>
          </div>
        </div>

        {/* Generate & Verify */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Generate & Verify Proofs
          </h3>

          <div className="space-y-4">
            <Button onClick={handleGenerateProofs} className="w-full">
              Generate Merkle Proofs
            </Button>

            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Last generated: 2 hours ago</p>
              <p className="text-sm text-muted-foreground">Total addresses: 24,582</p>
              <p className="text-sm text-muted-foreground">Root hash: 0x8f3a...c2e1</p>
            </div>
          </div>
        </div>

        {/* Eligibility Settings */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Eligibility Settings
          </h3>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium text-foreground">Restrict to Eligible Only</p>
              <p className="text-sm text-muted-foreground">
                Only whitelisted addresses can claim tokens
              </p>
            </div>
            <Switch
              checked={restrictToEligible}
              onCheckedChange={setRestrictToEligible}
            />
          </div>

          <div className={`p-4 rounded-lg ${restrictToEligible ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
            <p className={`text-sm ${restrictToEligible ? "text-green-500" : "text-yellow-500"}`}>
              {restrictToEligible
                ? "Claims are restricted to eligible miners only"
                : "Warning: Anyone can claim tokens"}
            </p>
          </div>
        </div>

        {/* Test Proof */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Test Proof
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proof">Enter wallet address or proof</Label>
              <div className="flex gap-2">
                <Input
                  id="proof"
                  placeholder="0x..."
                  value={testProof}
                  onChange={(e) => {
                    setTestProof(e.target.value);
                    setVerificationResult(null);
                  }}
                  className="bg-muted/50"
                />
                <Button onClick={handleTestProof}>Verify</Button>
              </div>
            </div>

            {verificationResult && (
              <div className={`p-4 rounded-lg ${
                verificationResult === "valid" 
                  ? "bg-green-500/10 text-green-500" 
                  : "bg-red-500/10 text-red-500"
              }`}>
                <p className="font-medium">
                  {verificationResult === "valid" ? "✓ Valid Proof" : "✗ Invalid Proof"}
                </p>
                <p className="text-sm opacity-80">
                  {verificationResult === "valid"
                    ? "This address is eligible to claim tokens."
                    : "This address is not in the whitelist."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMerkle;
