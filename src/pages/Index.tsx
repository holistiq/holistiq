import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart,
  Calendar,
  Settings,
  User,
  Activity,
  Plus,
  Check,
  Info,
  HelpCircle
} from "lucide-react";

const Index = () => {
  const isLoggedIn = localStorage.getItem("authToken");

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-secondary to-background">
        <div className="container px-4 md:px-6 flex flex-col items-center">
          <img
            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
            alt="Professional working on cognitive enhancement technology"
            className="rounded-xl mb-8 w-full max-w-2xl shadow-lg object-cover h-64 md:h-80"
          />
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl flex items-center justify-center gap-3">
                <Activity className="text-primary -mb-1" size={36} />
                Objectively Measure Your <span className="text-primary">Cognitive Enhancement</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Holistiq helps you determine if your supplements are actually working through standardized cognitive assessments and data-driven insights.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {isLoggedIn ? (
                <Link to="/dashboard">
                  <Button size="lg">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg">Get Started</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg">Log In</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl flex items-center justify-center gap-2">
                <HelpCircle className="inline text-primary" />
                How Holistiq Works
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                A simple, science-based approach to tracking your cognitive enhancement
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Establish Baseline</h3>
                <p className="text-muted-foreground text-center">
                  Complete an initial cognitive assessment to establish your baseline performance.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Plus className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Track Supplements</h3>
                <p className="text-muted-foreground text-center">
                  Log your supplement intake including dosage, timing, and frequency.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BarChart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Measure Progress</h3>
                <p className="text-muted-foreground text-center">
                  Take follow-up assessments and view your performance changes over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl flex items-center justify-center gap-2">
                <Settings className="inline text-primary" />
                Key Features
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="flex flex-col space-y-2 items-start md:items-center">
                <div className="flex items-center gap-2">
                  <BarChart className="text-primary" />
                  <h3 className="text-xl font-bold">Standardized Cognitive Assessment</h3>
                </div>
                <p className="text-muted-foreground">
                  Scientifically validated n-back test focusing on working memory performance.
                </p>
              </div>
              <div className="flex flex-col space-y-2 items-start md:items-center">
                <div className="flex items-center gap-2">
                  <Plus className="text-primary" />
                  <h3 className="text-xl font-bold">Supplement Tracking</h3>
                </div>
                <p className="text-muted-foreground">
                  Simple tools to log your supplement intake with dosage and timing information.
                </p>
              </div>
              <div className="flex flex-col space-y-2 items-start md:items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="text-primary" />
                  <h3 className="text-xl font-bold">Data Visualization</h3>
                </div>
                <p className="text-muted-foreground">
                  Clear charts showing your performance trends and comparison to baseline.
                </p>
              </div>
              <div className="flex flex-col space-y-2 items-start md:items-center">
                <div className="flex items-center gap-2">
                  <Check className="text-primary" />
                  <h3 className="text-xl font-bold">Privacy-Focused</h3>
                </div>
                <p className="text-muted-foreground">
                  Your data is private and secure with options to export or delete at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl flex items-center justify-center gap-2">
                <Info className="text-primary" />
                Ready to Track Your Cognitive Enhancement?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                Join Holistiq today and discover if your supplements are actually working.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {isLoggedIn ? (
                <Link to="/dashboard">
                  <Button size="lg">Go to Dashboard</Button>
                </Link>
              ) : (
                <Link to="/signup">
                  <Button size="lg">Get Started For Free</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
