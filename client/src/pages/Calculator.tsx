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
import { AlertCircle, Calculator as CalculatorIcon, CheckCircle, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Calculator() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const loanIdParam = new URLSearchParams(search).get("loanId");
  
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(
    loanIdParam ? parseInt(loanIdParam) : null
  );
  const [loanType, setLoanType] = useState<"FHA" | "VA" | "USDA" | "Conventional">("Conventional");
  const [baseIncome, setBaseIncome] = useState("");
  const [overtimeIncome, setOvertimeIncome] = useState("");
  const [bonusIncome, setBonusIncome] = useState("");
  const [commissionIncome, setCommissionIncome] = useState("");
  const [rentalIncome, setRentalIncome] = useState("");
  const [businessIncome, setBusinessIncome] = useState("");
  const [otherIncome, setOtherIncome] = useState("");
  const [monthlyDebt, setMonthlyDebt] = useState("");
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const { data: loans = [] } = trpc.loans.list.useQuery();
  const { data: selectedLoan } = trpc.loans.get.useQuery(
    { id: selectedLoanId! },
    { enabled: !!selectedLoanId }
  );

  const calculateIncome = trpc.income.calculate.useMutation({
    onSuccess: (data) => {
      setCalculationResult(data);
      toast.success("Income calculation completed!");
    },
    onError: (error) => {
      toast.error(`Calculation failed: ${error.message}`);
    },
  });

  useEffect(() => {
    if (selectedLoan) {
      setLoanType(selectedLoan.loanType);
    }
  }, [selectedLoan]);

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleCalculate = () => {
    if (!selectedLoanId) {
      toast.error("Please select a loan first");
      return;
    }

    calculateIncome.mutate({
      loanId: selectedLoanId,
      loanType,
      baseIncome: baseIncome ? parseInt(baseIncome) : undefined,
      overtimeIncome: overtimeIncome ? parseInt(overtimeIncome) : undefined,
      bonusIncome: bonusIncome ? parseInt(bonusIncome) : undefined,
      commissionIncome: commissionIncome ? parseInt(commissionIncome) : undefined,
      rentalIncome: rentalIncome ? parseInt(rentalIncome) : undefined,
      businessIncome: businessIncome ? parseInt(businessIncome) : undefined,
      otherIncome: otherIncome ? parseInt(otherIncome) : undefined,
      monthlyDebt: monthlyDebt ? parseInt(monthlyDebt) : undefined,
    });
  };

  const totalIncome =
    (parseInt(baseIncome) || 0) +
    (parseInt(overtimeIncome) || 0) +
    (parseInt(bonusIncome) || 0) +
    (parseInt(commissionIncome) || 0) +
    (parseInt(rentalIncome) || 0) +
    (parseInt(businessIncome) || 0) +
    (parseInt(otherIncome) || 0);

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
        <div className="container max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">AI Income Calculator</h1>
            <p className="text-muted-foreground">
              Calculate qualified income with AI-powered analysis using official mortgage guidelines
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Loan Selection</CardTitle>
                  <CardDescription>Select the loan to calculate income for</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div className="grid gap-2">
                    <Label htmlFor="loanType">Loan Type *</Label>
                    <Select value={loanType} onValueChange={(v: any) => setLoanType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FHA">FHA</SelectItem>
                        <SelectItem value="VA">VA</SelectItem>
                        <SelectItem value="USDA">USDA</SelectItem>
                        <SelectItem value="Conventional">Conventional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Income Information</CardTitle>
                  <CardDescription>Enter all annual income sources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="baseIncome">Base Annual Income</Label>
                    <Input
                      id="baseIncome"
                      type="number"
                      value={baseIncome}
                      onChange={(e) => setBaseIncome(e.target.value)}
                      placeholder="75000"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="overtimeIncome">Overtime Income (Annual)</Label>
                    <Input
                      id="overtimeIncome"
                      type="number"
                      value={overtimeIncome}
                      onChange={(e) => setOvertimeIncome(e.target.value)}
                      placeholder="5000"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bonusIncome">Bonus Income (Annual)</Label>
                    <Input
                      id="bonusIncome"
                      type="number"
                      value={bonusIncome}
                      onChange={(e) => setBonusIncome(e.target.value)}
                      placeholder="10000"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="commissionIncome">Commission Income (Annual)</Label>
                    <Input
                      id="commissionIncome"
                      type="number"
                      value={commissionIncome}
                      onChange={(e) => setCommissionIncome(e.target.value)}
                      placeholder="8000"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="rentalIncome">Rental Income (Annual)</Label>
                    <Input
                      id="rentalIncome"
                      type="number"
                      value={rentalIncome}
                      onChange={(e) => setRentalIncome(e.target.value)}
                      placeholder="12000"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="businessIncome">Business Income (Annual)</Label>
                    <Input
                      id="businessIncome"
                      type="number"
                      value={businessIncome}
                      onChange={(e) => setBusinessIncome(e.target.value)}
                      placeholder="20000"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="otherIncome">Other Income (Annual)</Label>
                    <Input
                      id="otherIncome"
                      type="number"
                      value={otherIncome}
                      onChange={(e) => setOtherIncome(e.target.value)}
                      placeholder="3000"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="monthlyDebt">Total Monthly Debt</Label>
                    <Input
                      id="monthlyDebt"
                      type="number"
                      value={monthlyDebt}
                      onChange={(e) => setMonthlyDebt(e.target.value)}
                      placeholder="2500"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Total Annual Income:</span>
                      <span className="text-2xl font-bold">${totalIncome.toLocaleString()}</span>
                    </div>
                    <Button
                      onClick={handleCalculate}
                      disabled={calculateIncome.isPending || !selectedLoanId}
                      className="w-full gradient-bg"
                      size="lg"
                    >
                      {calculateIncome.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <CalculatorIcon className="mr-2 h-4 w-4" />
                          Calculate Qualified Income
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {calculationResult ? (
                <>
                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Calculation Complete
                      </CardTitle>
                      <CardDescription>AI-powered income verification results</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Qualified Income</p>
                          <p className="text-2xl font-bold">
                            ${calculationResult.qualifiedIncome.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Back-End DTI</p>
                          <p className="text-2xl font-bold">{calculationResult.backEndRatio}%</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
                        <Badge
                          variant={
                            calculationResult.riskLevel === "low"
                              ? "default"
                              : calculationResult.riskLevel === "high"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {calculationResult.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {calculationResult.warnings && calculationResult.warnings.length > 0 && (
                    <Card className="border-yellow-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                          Warnings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {calculationResult.warnings.map((warning: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span className="text-yellow-500 mt-0.5">•</span>
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {calculationResult.missingDocuments &&
                    calculationResult.missingDocuments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Missing Documents
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {calculationResult.missingDocuments.map((doc: string, idx: number) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <span className="text-muted-foreground mt-0.5">•</span>
                                <span>{doc}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                  <Card>
                    <CardHeader>
                      <CardTitle>AI Analysis</CardTitle>
                      <CardDescription>Detailed underwriting recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <Streamdown>{calculationResult.analysis}</Streamdown>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="h-full flex items-center justify-center p-12">
                  <div className="text-center">
                    <CalculatorIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Calculate</h3>
                    <p className="text-muted-foreground">
                      Enter income information and click "Calculate Qualified Income" to see
                      AI-powered results
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
