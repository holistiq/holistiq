import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Pill, LineChart, ArrowRight, CheckCircle, BarChart, Sparkles } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="bg-background">{/* Removed min-h-screen as Layout already provides this */}

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">How Holistiq Works</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover if your supplements are actually working with data-driven insights and standardized cognitive assessments.
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Step 1 */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Activity className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Take Cognitive Tests</h3>
              <p className="text-muted-foreground mb-4">
                Establish your baseline cognitive performance with our scientifically validated tests measuring memory, reaction time, and accuracy.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Standardized assessments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Multiple cognitive domains</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Establish your baseline</span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Pill className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Log Your Supplements</h3>
              <p className="text-muted-foreground mb-4">
                Track the supplements you're taking, including dosage, timing, and frequency. Add notes about how you feel and any effects you notice.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Detailed supplement tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Record dosage and timing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Track confounding factors</span>
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <LineChart className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Analyze Your Results</h3>
              <p className="text-muted-foreground mb-4">
                Our analytics engine correlates your supplement intake with changes in cognitive performance to identify what's working for you.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Data-driven insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Personalized effectiveness reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Temporal analysis</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-muted/30 rounded-2xl p-8 border border-border mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <BarChart className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Performance Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor changes in your cognitive performance over time with detailed charts and metrics.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <Sparkles className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Effectiveness Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover which supplements are actually improving your cognitive performance.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <Pill className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Supplement Database</h3>
                  <p className="text-sm text-muted-foreground">
                    Access our comprehensive database of cognitive supplements and their known effects.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <Activity className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Confounding Factor Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Account for variables like sleep, stress, and exercise that might affect your results.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to optimize your cognitive performance?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join Holistiq today and start tracking your supplements and cognitive performance with data-driven insights.
            </p>
            <Link to="/signin">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
