import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { AlertCircle, Calculator, FileText, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [borrowerName, setBorrowerName] = useState("");
  const [loanType, setLoanType] = useState<"FHA" | "VA" | "USDA" | "Conventional">("Conventional");
  const [loanAmount, setLoanAmount] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");

  const utils = trpc.useUtils();
  const { data: loans = [], isLoading } = trpc.loans.list.useQuery();
  const createLoan = trpc.loans.create.useMutation({
    onSuccess: () => {
      utils.loans.list.invalidate();
      setIsCreateDialogOpen(false);
      setBorrowerName("");
      setLoanAmount("");
      setPropertyAddress("");
      toast.success("Loan created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create loan: ${error.message}`);
    },
  });

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleCreateLoan = () => {
    if (!borrowerName || !loanAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    createLoan.mutate({
      borrowerName,
      loanType,
      loanAmount: parseInt(loanAmount),
      propertyAddress: propertyAddress || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      processing: "default",
      verified: "outline",
      approved: "outline",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getRiskBadge = (risk: string | null) => {
    if (!risk) return null;
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      low: "default",
      medium: "secondary",
      high: "destructive",
    };
    return <Badge variant={variants[risk] || "default"}>Risk: {risk}</Badge>;
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
        <div className="container">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loans.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Processing</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loans.filter((l) => l.status === "processing").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loans.filter((l) => l.status === "verified" || l.status === "approved").length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loans.filter((l) => l.riskLevel === "high").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loans List */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Your Loans</h2>
              <p className="text-muted-foreground">Manage and track all your loan applications</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-bg">
                  <Plus className="mr-2 h-4 w-4" />
                  New Loan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Loan</DialogTitle>
                  <DialogDescription>
                    Enter the borrower information to create a new loan application.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="borrowerName">Borrower Name *</Label>
                    <Input
                      id="borrowerName"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      placeholder="John Doe"
                    />
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
                  <div className="grid gap-2">
                    <Label htmlFor="loanAmount">Loan Amount *</Label>
                    <Input
                      id="loanAmount"
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="350000"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="propertyAddress">Property Address</Label>
                    <Input
                      id="propertyAddress"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      placeholder="123 Main St, City, State ZIP"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLoan} disabled={createLoan.isPending}>
                    {createLoan.isPending ? "Creating..." : "Create Loan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading loans...</p>
            </div>
          ) : loans.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No loans yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first loan to get started with AI-powered income verification.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Loan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {loans.map((loan) => (
                <Card key={loan.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{loan.borrowerName}</CardTitle>
                        <CardDescription>
                          {loan.loanNumber} • {loan.loanType} • $
                          {loan.loanAmount.toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(loan.status)}
                        {getRiskBadge(loan.riskLevel)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      {loan.qualifiedIncome && (
                        <div>
                          <p className="text-sm text-muted-foreground">Qualified Income</p>
                          <p className="text-lg font-semibold">
                            ${loan.qualifiedIncome.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {loan.debtToIncomeRatio && (
                        <div>
                          <p className="text-sm text-muted-foreground">DTI Ratio</p>
                          <p className="text-lg font-semibold">{loan.debtToIncomeRatio}%</p>
                        </div>
                      )}
                      {loan.incomeTrend && (
                        <div>
                          <p className="text-sm text-muted-foreground">Income Trend</p>
                          <p className="text-lg font-semibold">{loan.incomeTrend}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/calculator?loanId=${loan.id}`}>
                        <Button size="sm" variant="outline">
                          <Calculator className="mr-2 h-4 w-4" />
                          Calculate Income
                        </Button>
                      </Link>
                      <Link href={`/loan/${loan.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
