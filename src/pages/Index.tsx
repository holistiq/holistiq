
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const isLoggedIn = localStorage.getItem("authToken");

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-secondary to-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Objectively Measure Your <span className="text-primary">Cognitive Enhancement</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                NooTrack helps you determine if your supplements are actually working through standardized cognitive assessments and data-driven insights.
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
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">How NooTrack Works</h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                A simple, science-based approach to tracking your cognitive enhancement
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold">Establish Baseline</h3>
                <p className="text-muted-foreground text-center">
                  Complete an initial cognitive assessment to establish your baseline performance.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold">Track Supplements</h3>
                <p className="text-muted-foreground text-center">
                  Log your supplement intake including dosage, timing, and frequency.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-2xl font-bold">3</span>
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
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Key Features</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="flex flex-col space-y-2">
                <h3 className="text-xl font-bold">Standardized Cognitive Assessment</h3>
                <p className="text-muted-foreground">
                  Scientifically validated n-back test focusing on working memory performance.
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <h3 className="text-xl font-bold">Supplement Tracking</h3>
                <p className="text-muted-foreground">
                  Simple tools to log your supplement intake with dosage and timing information.
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <h3 className="text-xl font-bold">Data Visualization</h3>
                <p className="text-muted-foreground">
                  Clear charts showing your performance trends and comparison to baseline.
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <h3 className="text-xl font-bold">Privacy-Focused</h3>
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
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Ready to Track Your Cognitive Enhancement?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                Join NooTrack today and discover if your supplements are actually working.
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
