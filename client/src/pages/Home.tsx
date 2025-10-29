import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { ArrowRight, Calculator, FileCheck, Shield, TrendingUp, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
            <span className="text-xl font-bold gradient-text">{APP_TITLE}</span>
          </div>
          <nav className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link href="/calculator">
                  <Button>Income Calculator</Button>
                </Link>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost">Sign In</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button className="gradient-bg">Get Started</Button>
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg text-white py-20 lg:py-32">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              AI Co-pilots built to move lending decisions upfront
            </h1>
            <p className="text-lg lg:text-xl mb-8 text-white/90">
              Verify income, classify docs, and flag missing files at origination — building
              consistency, confidence, and compliance into every loan before it hits underwriting.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href={isAuthenticated ? "/calculator" : getLoginUrl()}>
                <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90">
                  Calculate Income Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <a href={isAuthenticated ? "/dashboard" : getLoginUrl()}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Dashboard
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Reliable AI Co-pilots built for Mortgage Lenders
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powered by The Lawson Group
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-gradient border-2">
              <CardHeader>
                <Calculator className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Upfront Income Verification</CardTitle>
                <CardDescription>
                  Get income verified upfront, so your underwriters focus on decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Analyze bank statements, W2s, tax forms</li>
                  <li>• Calculate QI in just 2 minutes</li>
                  <li>• Support for business returns and more</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-gradient border-2">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Risk & Fraud Detection</CardTitle>
                <CardDescription>
                  Assess risk and detect fraud at intake with AI-powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Real-time fraud detection</li>
                  <li>• Risk level assessment</li>
                  <li>• Notify about missing files</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-gradient border-2">
              <CardHeader>
                <FileCheck className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Document Classification</CardTitle>
                <CardDescription>
                  Automatically classify and verify mortgage documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Auto-classify W2s, paystubs, tax returns</li>
                  <li>• Flag missing documentation</li>
                  <li>• Verify document completeness</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-gradient border-2">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Income Trend Analysis</CardTitle>
                <CardDescription>
                  Track income trends and fluctuations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Month-over-month income tracking</li>
                  <li>• Detect fluctuating income patterns</li>
                  <li>• Healthy balance verification</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-gradient border-2">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-Guideline Support</CardTitle>
                <CardDescription>
                  Integrated with FHA, VA, USDA, Fannie Mae & Freddie Mac guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Real-time guideline updates</li>
                  <li>• Automated compliance checking</li>
                  <li>• Agency-specific calculations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-gradient border-2">
              <CardHeader>
                <Calculator className="h-10 w-10 text-primary mb-2" />
                <CardTitle>DTI Ratio Calculation</CardTitle>
                <CardDescription>
                  Accurate debt-to-income ratio calculations with AI validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Front-end and back-end ratios</li>
                  <li>• Guideline-specific thresholds</li>
                  <li>• Automated compliance checks</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Loan Types Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Built for every lending channel
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>FHA Loans</CardTitle>
                <CardDescription>
                  HUD Handbook 4000.1 compliant income calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Integrated with official FHA guidelines for accurate income verification and
                  debt-to-income calculations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>VA Loans</CardTitle>
                <CardDescription>
                  VA Lenders Handbook (Pamphlet 26-7) integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Residual income calculations and veteran-specific eligibility requirements.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>USDA Loans</CardTitle>
                <CardDescription>
                  HB-1-3555 Single Family Housing Program compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Rural housing program requirements with household income eligibility checks.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conventional Loans</CardTitle>
                <CardDescription>
                  Fannie Mae & Freddie Mac Selling Guide integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Desktop Underwriter (DU) and Loan Prospector (LP) compatible calculations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg text-white py-20">
        <div className="container text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to accelerate your loan decisions?
          </h2>
          <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
            Join leading lenders who trust Mortgage AI 360 to make their job easier and enhance
            the borrower experience.
          </p>
          <a href={isAuthenticated ? "/calculator" : getLoginUrl()}>
            <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 {APP_TITLE}. Powered by The Lawson Group. All rights reserved.</p>
          <p className="mt-2">
            Integrated with official FHA, VA, USDA, Fannie Mae, and Freddie Mac guidelines.
          </p>
        </div>
      </footer>
    </div>
  );
}
