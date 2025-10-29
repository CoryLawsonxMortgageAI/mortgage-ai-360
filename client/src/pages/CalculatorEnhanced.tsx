import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  AlertCircle, 
  Calculator as CalculatorIcon, 
  CheckCircle, 
  FileText, 
  Loader2,
  Upload,
  X,
  FileCheck,
  TrendingUp
} from "lucide-react";
import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

interface GuidelineCalculation {
  loanType: string;
  qualifiedIncome: number;
  backEndRatio: string;
  riskLevel: string;
  citations: string[];
  warnings: string[];
  analysis: string;
}

export default function CalculatorEnhanced() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [calculationResults, setCalculationResults] = useState<{
    reportId: string;
    calculations: GuidelineCalculation[];
    documentsReviewed: string[];
  } | null>(null);

  const { data: loans = [] } = trpc.loans.list.useQuery();

  const calculateMultiGuideline = trpc.income.calculateMultiGuideline.useMutation({
    onSuccess: (data: any) => {
      setCalculationResults(data);
      toast.success(`Report ${data.reportId} generated successfully!`);
    },
    onError: (error: any) => {
      toast.error(`Calculation failed: ${error.message}`);
    },
  });

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped. Only PDF and image files are supported.");
    }

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${validFiles.length} file(s) uploaded`);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    const newFiles: UploadedFile[] = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${files.length} file(s) uploaded`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCalculate = async () => {
    if (!selectedLoanId) {
      toast.error("Please select a loan first");
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one document");
      return;
    }

    // In a real implementation, we would upload files to S3 first
    // For now, we'll simulate with file names
    calculateMultiGuideline.mutate({
      loanId: selectedLoanId,
      documentNames: uploadedFiles.map(f => f.name),
    });
  };

  const getLoanTypeColor = (loanType: string) => {
    const colors: Record<string, string> = {
      FHA: "bg-blue-100 text-blue-800 border-blue-300",
      VA: "bg-green-100 text-green-800 border-green-300",
      USDA: "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Conventional (Fannie Mae)": "bg-purple-100 text-purple-800 border-purple-300",
      "Conventional (Freddie Mac)": "bg-pink-100 text-pink-800 border-pink-300",
    };
    return colors[loanType] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
              <span className="text-xl font-bold gradient-text">{APP_TITLE}</span>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/calculator">
              <Button variant="ghost">Calculator</Button>
            </Link>
            <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">AI Multi-Guideline Income Calculator</h1>
            <p className="text-muted-foreground">
              Upload documents and get income calculations for ALL loan types with guideline citations
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Loan Selection</CardTitle>
                  <CardDescription>Select the loan to calculate income for</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <Label htmlFor="loan">Select Loan *</Label>
                    <Select
                      value={selectedLoanId?.toString() || ""}
                      onValueChange={(v) => setSelectedLoanId(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a loan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {loans.map((loan) => (
                          <SelectItem key={loan.id} value={loan.id.toString()}>
                            {loan.borrowerName} - {loan.loanNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Document Upload
                  </CardTitle>
                  <CardDescription>
                    Drag and drop W2s, paystubs, tax returns, and bank statements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-2">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supports PDF, PNG, JPG (Max 10MB per file)
                    </p>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      Browse Files
                    </Button>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Documents ({uploadedFiles.length})</Label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleCalculate}
                    disabled={calculateMultiGuideline.isPending || !selectedLoanId || uploadedFiles.length === 0}
                    className="w-full gradient-bg"
                    size="lg"
                  >
                    {calculateMultiGuideline.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Documents...
                      </>
                    ) : (
                      <>
                        <CalculatorIcon className="mr-2 h-4 w-4" />
                        Calculate for All Guidelines
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {calculationResults ? (
                <>
                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Multi-Guideline Analysis Complete
                      </CardTitle>
                      <CardDescription>
                        Report ID: <span className="font-mono font-bold">{calculationResults.reportId}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label>Documents Reviewed:</Label>
                        <div className="flex flex-wrap gap-2">
                          {calculationResults.documentsReviewed.map((doc, idx) => (
                            <Badge key={idx} variant="outline">
                              {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Individual Guideline Results */}
                  {calculationResults.calculations.map((calc, idx) => (
                    <Card key={idx} className={`border-2 ${getLoanTypeColor(calc.loanType)}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{calc.loanType}</span>
                          <Badge
                            variant={
                              calc.riskLevel === "low"
                                ? "default"
                                : calc.riskLevel === "high"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {calc.riskLevel.toUpperCase()} RISK
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Qualified Income</p>
                            <p className="text-2xl font-bold">
                              ${calc.qualifiedIncome.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Back-End DTI</p>
                            <p className="text-2xl font-bold">{calc.backEndRatio}%</p>
                          </div>
                        </div>

                        {calc.warnings.length > 0 && (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              Warnings
                            </Label>
                            <ul className="space-y-1">
                              {calc.warnings.map((warning, widx) => (
                                <li key={widx} className="text-sm flex items-start gap-2">
                                  <span className="text-yellow-600 mt-0.5">•</span>
                                  <span>{warning}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Guideline Citations
                          </Label>
                          <div className="bg-muted p-3 rounded-lg space-y-1">
                            {calc.citations.map((citation, cidx) => (
                              <p key={cidx} className="text-xs font-mono">
                                {citation}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Analysis</Label>
                          <div className="prose prose-sm max-w-none bg-muted p-3 rounded-lg">
                            <Streamdown>{calc.analysis}</Streamdown>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <Card className="h-full flex items-center justify-center p-12">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Ready for Multi-Guideline Analysis</h3>
                    <p className="text-muted-foreground">
                      Upload documents and click "Calculate for All Guidelines" to see income
                      calculations for FHA, VA, USDA, Fannie Mae, and Freddie Mac
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
