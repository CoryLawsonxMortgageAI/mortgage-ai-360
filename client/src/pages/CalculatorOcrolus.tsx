import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Upload,
  FileText,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  DollarSign,
  BarChart3,
  Settings,
  Search,
  User,
  Menu,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export default function CalculatorOcrolus() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedLoan, setSelectedLoan] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [configuration, setConfiguration] = useState({
    useTwoYearForms: true,
    employmentStartDate: "",
    extraordinaryExpenses: "",
    includeBorrowerIncome: true,
  });
  const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: loans = [] } = trpc.loans.list.useQuery();

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const calculateMutation = trpc.income.calculateMultiGuideline.useMutation({
    onSuccess: (data: any) => {
      setExtractedData(data);
      toast.success(`Analysis complete - Report ${data.reportId}`);
    },
    onError: (error: any) => {
      toast.error(`Calculation failed: ${error.message}`);
    },
  });

  // Define all event handlers with useCallback
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
    toast.success(`${files.length} file(s) selected`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type === 'application/pdf' ||
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...files]);
      toast.success(`${files.length} file(s) uploaded`);
    } else {
      toast.error('Please upload PDF or image files only');
    }
  }, []);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="p-8 bg-slate-800 border-slate-700">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
            <p className="text-slate-300">Please sign in to access the income calculator</p>
            <a
              href={getLoginUrl()}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
          </div>
        </Card>
      </div>
    );
  }

  const handleCalculate = async () => {
    if (!selectedLoan) {
      toast.error("Please select a loan first");
      return;
    }
    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one document");
      return;
    }

    const documentNames = uploadedFiles.map((f) => f.name);
    calculateMutation.mutate({
      loanId: selectedLoan,
      documentNames,
    });
  };

  const toggleLock = (fieldId: string) => {
    setLockedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  };

  const mockExtractedData = {
    form1120: {
      year2024: {
        taxableIncome: 177532.0,
        totalTax: 27755.0,
        nonrecurringGains: 0,
        depreciation: 12663.0,
        depletion: 0,
        amortization: 0,
        netOperatingLoss: 0,
      },
      year2023: {
        taxableIncome: 212240.0,
        totalTax: 30886.0,
        nonrecurringGains: -8000.0,
        depreciation: 10079.0,
        depletion: 0,
        amortization: 0,
        netOperatingLoss: 0,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8" />
              <span className="text-xl font-semibold text-white">{APP_TITLE}</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search"
                className="w-80 bg-slate-800 border-slate-700 pl-10 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-20 border-r border-slate-700 bg-slate-900/30 flex flex-col items-center py-8 gap-6">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <Menu className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <FileText className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-300 hover:bg-slate-800">
            <DollarSign className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <BarChart3 className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <Search className="h-6 w-6" />
          </Button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Top Bar */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-white">
                  {selectedLoan
                    ? loans.find((l) => l.id === selectedLoan)?.borrowerName || "Borrower"
                    : "Select Loan"}
                </h1>
                <Select value={selectedLoan?.toString()} onValueChange={(val) => setSelectedLoan(Number(val))}>
                  <SelectTrigger className="w-64 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select a loan" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {loans.map((loan) => (
                      <SelectItem key={loan.id} value={loan.id.toString()} className="text-white">
                        {loan.borrowerName} - ${loan.loanAmount?.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-2 flex gap-6 text-sm text-slate-400">
                <span>Uploads: {uploadedFiles.length}</span>
                <span>Documents: {uploadedFiles.length}</span>
                <span>Created: {new Date().toLocaleDateString()}</span>
                <span>Modified: {new Date().toLocaleDateString()}</span>
                <span>Processing type: Full control</span>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadClick}
            className={`mb-6 cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'
            } border-2 border-dashed rounded-lg p-12`}
          >
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className={`rounded-full p-4 ${
                isDragging ? 'bg-blue-500/20' : 'bg-slate-700/50'
              }`}>
                <Upload className={`h-12 w-12 ${
                  isDragging ? 'text-blue-400' : 'text-slate-400'
                }`} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white mb-2">
                  {isDragging ? 'Drop files here' : 'Drag and drop files here'}
                </p>
                <p className="text-sm text-slate-400">
                  or click to browse • PDF, PNG, JPG, JPEG supported
                </p>
              </div>
              {uploadedFiles.length > 0 && (
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                </Badge>
              )}
            </div>
          </div>

          {/* Document List */}
          {uploadedFiles.length > 0 && (
            <Card className="mb-6 bg-slate-800/50 border-slate-700 p-4">
              <h3 className="text-white font-semibold mb-3">Uploaded Documents</h3>
              <div className="space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <span className="text-slate-300">{file.name}</span>
                    </div>
                    <span className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Income Data */}
            <div className="col-span-2 space-y-6">
              {/* Income Form Section */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">IRS Form 1120 – Regular Corporation</h2>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    Based on Fannie Mae 4506 guidelines
                  </Badge>
                </div>

                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="bg-slate-900 border-slate-700">
                    <TabsTrigger value="summary" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="wage" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                      Wage earner
                    </TabsTrigger>
                    <TabsTrigger value="self" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                      Self-employed
                    </TabsTrigger>
                    <TabsTrigger value="rental" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                      Rental
                    </TabsTrigger>
                    <TabsTrigger value="other" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                      Other
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-4">
                    <div className="space-y-1">
                      {/* Header Row */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-400 pb-2 border-b border-slate-700">
                        <div className="col-span-6">Form 1120 - Regular Corporation</div>
                        <div className="col-span-3 text-center">2024</div>
                        <div className="col-span-3 text-center">2023</div>
                      </div>

                      {/* Data Rows */}
                      {[
                        {
                          label: "a. Taxable Income (Line 30)",
                          field: "taxableIncome",
                          val2024: "$177,532.00",
                          val2023: "$212,240.00",
                          trend: "down",
                        },
                        {
                          label: "b. Total Tax (Line 31)",
                          field: "totalTax",
                          val2024: "$27,755.00",
                          val2023: "$30,886.00",
                          trend: "down",
                        },
                        {
                          label: "c. Nonrecurring (Gains) Losses (Lines 8, 9)",
                          field: "nonrecurring",
                          val2024: "$0.00",
                          val2023: "-$8,000.00",
                          trend: "up",
                        },
                        {
                          label: "d. Nonrecurring Other (Income) Loss (Line 10)",
                          field: "otherIncome",
                          val2024: "$0.00",
                          val2023: "-$8,000.00",
                          trend: "up",
                        },
                        {
                          label: "e. Depreciation (Line 20)",
                          field: "depreciation",
                          val2024: "$12,663.00",
                          val2023: "$10,079.00",
                          trend: "up",
                        },
                        {
                          label: "f. Depletion (Line 21)",
                          field: "depletion",
                          val2024: "$0.00",
                          val2023: "$0.00",
                          trend: "neutral",
                        },
                      ].map((row, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 py-2 hover:bg-slate-700/30 rounded text-sm items-center"
                        >
                          <div className="col-span-6 text-slate-300">{row.label}</div>
                          <div className="col-span-3 flex items-center justify-between px-2">
                            <span className={row.trend === "down" ? "text-red-400" : "text-slate-200"}>
                              {row.val2024}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleLock(row.field + "2024")}
                            >
                              {lockedFields.has(row.field + "2024") ? (
                                <Lock className="h-3 w-3 text-slate-400" />
                              ) : (
                                <Unlock className="h-3 w-3 text-slate-500" />
                              )}
                            </Button>
                          </div>
                          <div className="col-span-3 flex items-center justify-between px-2">
                            <span className={row.trend === "down" ? "text-slate-200" : "text-red-400"}>
                              {row.val2023}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleLock(row.field + "2023")}
                            >
                              {lockedFields.has(row.field + "2023") ? (
                                <Lock className="h-3 w-3 text-slate-400" />
                              ) : (
                                <Unlock className="h-3 w-3 text-slate-500" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Calculate Button */}
              <Button
                onClick={handleCalculate}
                disabled={calculateMutation.isPending || !selectedLoan || uploadedFiles.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
              >
                {calculateMutation.isPending ? "Calculating..." : "Calculate Income for All Loan Types"}
              </Button>
            </div>

            {/* Right Column - Configuration & Results */}
            <div className="space-y-6">
              {/* Recommended Calculation */}
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-300"></div>
                    <span className="text-xs font-semibold text-blue-100">Recommended</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">$4,341.67</div>
                <div className="text-sm text-blue-100">mo. per Fannie Mae calc</div>
              </Card>

              {/* Alternative Calculation */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-slate-500"></div>
                    <span className="text-xs font-semibold text-slate-400">Alternative</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">$0.00</div>
                <div className="text-sm text-slate-400">mo. per manual calc</div>
              </Card>

              {/* Configuration */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-white font-semibold mb-4">Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-income" className="text-slate-300 text-sm">
                      Include income from PATRICK P...
                    </Label>
                    <Switch
                      id="include-income"
                      checked={configuration.includeBorrowerIncome}
                      onCheckedChange={(checked) =>
                        setConfiguration((prev) => ({ ...prev, includeBorrowerIncome: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="two-year" className="text-slate-300 text-sm">
                      Use two-year tax forms
                    </Label>
                    <Switch
                      id="two-year"
                      checked={configuration.useTwoYearForms}
                      onCheckedChange={(checked) =>
                        setConfiguration((prev) => ({ ...prev, useTwoYearForms: checked }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="start-date" className="text-slate-300 text-sm">
                      Employment start date *
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={configuration.employmentStartDate}
                      onChange={(e) =>
                        setConfiguration((prev) => ({ ...prev, employmentStartDate: e.target.value }))
                      }
                      className="mt-1 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expenses" className="text-slate-300 text-sm">
                      2024 Extraordinary one-time expenses *
                    </Label>
                    <Input
                      id="expenses"
                      type="number"
                      placeholder="123"
                      value={configuration.extraordinaryExpenses}
                      onChange={(e) =>
                        setConfiguration((prev) => ({ ...prev, extraordinaryExpenses: e.target.value }))
                      }
                      className="mt-1 bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </Card>

              {/* Liquidity */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-white font-semibold mb-4">Liquidity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Current ratio</span>
                    <span className="text-2xl font-bold text-green-400">2.70</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Quick ratio</span>
                    <span className="text-2xl font-bold text-green-400">2.21</span>
                  </div>
                </div>
              </Card>

              {/* Insights */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-600 text-xs font-bold">
                    11
                  </span>
                  Insights
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: "2", text: "Borrower information mismatch", color: "yellow" },
                    { icon: "1", text: "New address record found", color: "yellow" },
                    { icon: "1", text: "New employment record found", color: "yellow" },
                    { icon: "1", text: "No supporting employment document found", color: "yellow" },
                    { icon: "3", text: "Loan details information mismatch", color: "yellow" },
                  ].map((insight, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          insight.color === "yellow" ? "bg-yellow-600" : "bg-red-600"
                        } text-xs font-bold text-white`}
                      >
                        {insight.icon}
                      </span>
                      <span className="text-slate-300">{insight.text}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Results Section */}
          {extractedData && (
            <div className="mt-8">
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  Multi-Guideline Analysis - Report {extractedData.reportId}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {extractedData.calculations?.map((calc: any, idx: number) => (
                    <Card key={idx} className="bg-slate-900/50 border-slate-600 p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">{calc.loanType}</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-slate-400">Qualified Income:</span>
                          <div className="text-2xl font-bold text-green-400">
                            ${calc.qualifiedIncome?.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-400">Back-End DTI:</span>
                          <div className="text-lg font-semibold text-white">{calc.backEndRatio}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            calc.riskLevel === "low"
                              ? "border-green-500 text-green-400"
                              : calc.riskLevel === "medium"
                                ? "border-yellow-500 text-yellow-400"
                                : "border-red-500 text-red-400"
                          }
                        >
                          {calc.riskLevel.toUpperCase()} RISK
                        </Badge>
                        <div className="text-xs text-slate-400 mt-2">
                          <strong>Citations:</strong>
                          <ul className="mt-1 space-y-1">
                            {calc.citations?.slice(0, 2).map((citation: string, i: number) => (
                              <li key={i}>• {citation}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
