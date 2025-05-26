import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart,
  Settings,
  Activity,
  Plus,
  Info,
  HelpCircle,
  Pill,
  Brain,
  ShieldCheck,
  LayoutDashboard,
  Zap,
  ArrowRight,
  Star,
  Sparkles,
  LineChart,
} from "lucide-react";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { AnimatedSection } from "@/components/ui/animated-section";
import { TestimonialCard } from "@/components/home/TestimonialCard";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { FeatureCard } from "@/components/home/FeatureCard";

const Index = () => {
  const { user } = useSupabaseAuth();

  return (
    <div className="flex flex-col">
      {/* Hero Section - Modern Split Layout */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-secondary/10 to-background overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <AnimatedSection className="flex flex-col gap-6" delay={100}>
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 w-fit">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                <span>Scientifically validated approach</span>
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  Measure Your{" "}
                  <span className="text-primary">Cognitive Enhancement</span>
                </h1>
                <p className="text-xl text-muted-foreground md:text-2xl max-w-[600px]">
                  Discover if your supplements are actually working with
                  data-driven insights and standardized cognitive assessments.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                {user ? (
                  <Link to="/dashboard">
                    <Button size="lg" className="gap-2 text-base">
                      <BarChart size={20} /> Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/signin">
                    <Button size="lg" className="gap-2 text-base">
                      <Plus size={20} /> Get Started
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-xs font-medium text-primary`}
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">500+</span> users tracking their
                  cognitive enhancement
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection className="relative" direction="left" delay={300}>
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent z-10 pointer-events-none"></div>
                <img
                  src="/assets/images/hero/cognitive-tracking.png"
                  alt="Woman tracking cognitive performance with Holistiq"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-background rounded-lg shadow-lg p-4 border border-border z-20 max-w-[200px] hidden md:block">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Score Trend</span>
                </div>
                <div className="h-16 bg-primary/5 rounded-md flex items-end p-1">
                  {[
                    { id: "bar-1", height: 30 },
                    { id: "bar-2", height: 45 },
                    { id: "bar-3", height: 40 },
                    { id: "bar-4", height: 60 },
                    { id: "bar-5", height: 55 },
                    { id: "bar-6", height: 75 },
                    { id: "bar-7", height: 85 },
                  ].map((bar) => (
                    <div
                      key={bar.id}
                      className="flex-1 mx-0.5"
                      style={{ height: `${bar.height}%` }}
                    >
                      <div className="w-full h-full bg-primary rounded-sm"></div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced with animations */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-background relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
        <div className="container px-4 md:px-6 relative">
          <AnimatedSection className="flex flex-col items-center gap-4 text-center mb-16">
            <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-sm font-medium text-primary">
              <HelpCircle className="mr-1 h-3.5 w-3.5" />
              Simple 3-Step Process
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                How Holistiq Works
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                A science-based approach to tracking your cognitive enhancement
                journey
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mt-8 relative">
            {/* Connecting line between steps */}
            <div className="absolute top-16 left-0 w-full h-0.5 bg-primary/20 hidden md:block"></div>

            {/* Step 1: Establish Baseline */}
            <AnimatedSection className="relative" delay={100}>
              <div className="flex flex-col items-center space-y-6 p-6 rounded-xl bg-background border border-border shadow-sm relative h-full">
                {/* Step Number */}
                <div className="absolute -top-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:left-1/2 md:-translate-x-1/2">
                  <span className="text-xl font-bold">1</span>
                </div>

                {/* Icon */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Brain className="h-10 w-10" />
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Establish Baseline</h3>
                  <p className="text-muted-foreground min-h-[60px]">
                    Complete an initial cognitive assessment to establish your
                    baseline performance metrics.
                  </p>
                </div>

                {/* Action Link */}
                <Link
                  to="/baseline-test"
                  className="text-primary font-medium hover:underline inline-flex items-center mt-auto"
                >
                  Take baseline test
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* Step 2: Track Supplements */}
            <AnimatedSection className="relative" delay={200}>
              <div className="flex flex-col items-center space-y-6 p-6 rounded-xl bg-background border border-border shadow-sm relative h-full">
                {/* Step Number */}
                <div className="absolute -top-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:left-1/2 md:-translate-x-1/2">
                  <span className="text-xl font-bold">2</span>
                </div>

                {/* Icon */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Pill className="h-10 w-10" />
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Track Supplements</h3>
                  <p className="text-muted-foreground min-h-[60px]">
                    Log your supplement intake including dosage, timing, and
                    frequency for accurate analysis.
                  </p>
                </div>

                {/* Action Link */}
                <Link
                  to="/log-supplement"
                  className="text-primary font-medium hover:underline inline-flex items-center mt-auto"
                >
                  Log supplements
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* Step 3: Measure Progress */}
            <AnimatedSection className="relative" delay={300}>
              <div className="flex flex-col items-center space-y-6 p-6 rounded-xl bg-background border border-border shadow-sm relative h-full">
                {/* Step Number */}
                <div className="absolute -top-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:left-1/2 md:-translate-x-1/2">
                  <span className="text-xl font-bold">3</span>
                </div>

                {/* Icon */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LineChart className="h-10 w-10" />
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Measure Progress</h3>
                  <p className="text-muted-foreground min-h-[60px]">
                    Take follow-up assessments and view your performance trends
                    over time with detailed insights.
                  </p>
                </div>

                {/* Action Link */}
                <Link
                  to="/take-test"
                  className="text-primary font-medium hover:underline inline-flex items-center mt-auto"
                >
                  Take follow-up test
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Quick Actions Section - Enhanced with animations and better styling */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-muted/30 to-background">
        <div className="container px-4 md:px-6">
          <AnimatedSection className="flex flex-col items-center gap-4 text-center mb-12">
            <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-sm font-medium text-primary">
              <Zap className="mr-1 h-3.5 w-3.5" />
              Get Started Quickly
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                Quick Actions
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Jump right in with these common tasks to start tracking your
                cognitive enhancement
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <AnimatedSection delay={100} direction="up">
              <Link to="/test-router" className="group block h-full">
                <div className="flex flex-col items-center p-6 bg-background rounded-xl border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/50 h-full">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Brain className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">
                    Take Cognitive Test
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Measure your cognitive performance with our standardized
                    assessment
                  </p>
                  <div className="mt-auto pt-2 text-primary text-sm font-medium group-hover:underline flex items-center">
                    Start test
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </AnimatedSection>

            <AnimatedSection delay={200} direction="up">
              <Link to="/log-supplement" className="group block h-full">
                <div className="flex flex-col items-center p-6 bg-background rounded-xl border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/50 h-full">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Pill className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">Log Supplement</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Track your supplement intake with dosage and timing
                    information
                  </p>
                  <div className="mt-auto pt-2 text-primary text-sm font-medium group-hover:underline flex items-center">
                    Log supplement
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </AnimatedSection>

            <AnimatedSection delay={300} direction="up">
              <Link to="/log-confounding-factor" className="group block h-full">
                <div className="flex flex-col items-center p-6 bg-background rounded-xl border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/50 h-full">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Activity className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">Log Factors</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Record lifestyle factors that may affect your cognitive
                    performance
                  </p>
                  <div className="mt-auto pt-2 text-primary text-sm font-medium group-hover:underline flex items-center">
                    Log factors
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </AnimatedSection>

            <AnimatedSection delay={400} direction="up">
              <Link to="/dashboard" className="group block h-full">
                <div className="flex flex-col items-center p-6 bg-background rounded-xl border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/50 h-full">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <LayoutDashboard className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">View Dashboard</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    See your performance trends and analyze your supplement
                    effectiveness
                  </p>
                  <div className="mt-auto pt-2 text-primary text-sm font-medium group-hover:underline flex items-center">
                    Go to dashboard
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Features Section - Redesigned with FeatureCard component */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-secondary/20 to-background/80 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
        <div className="container px-4 md:px-6 relative">
          <AnimatedSection className="flex flex-col items-center gap-4 text-center mb-12">
            <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-sm font-medium text-primary">
              <Settings className="mr-1 h-3.5 w-3.5" />
              Powerful Capabilities
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                Key Features
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Comprehensive tools to optimize your cognitive enhancement
                journey
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <AnimatedSection delay={100}>
              <FeatureCard
                title="Standardized Cognitive Tests"
                description="Scientifically validated assessments that measure multiple cognitive domains including memory, attention, and processing speed."
                icon={Brain}
              />
            </AnimatedSection>

            <AnimatedSection delay={150}>
              <FeatureCard
                title="Data-Driven Insights"
                description="Detailed analytics that show the impact of supplements on your cognitive performance with statistical significance indicators."
                icon={BarChart}
              />
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <FeatureCard
                title="Supplement Tracking"
                description="Comprehensive logging of supplements, dosages, and timing for accurate correlation with performance changes."
                icon={Pill}
              />
            </AnimatedSection>

            <AnimatedSection delay={250}>
              <FeatureCard
                title="Confounding Factor Analysis"
                description="Advanced tracking of lifestyle variables such as sleep quality, stress levels, exercise, and diet that may influence cognitive performance to isolate true supplement effects."
                icon={Activity}
              />
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <FeatureCard
                title="Educational Resources"
                description="Curated evidence-based information on supplements, cognitive enhancement strategies, and best practices drawn from peer-reviewed scientific literature and clinical research."
                icon={Info}
              />
            </AnimatedSection>

            <AnimatedSection delay={350}>
              <FeatureCard
                title="Privacy-Focused Design"
                description="End-to-end encrypted data storage with comprehensive user controls for data management, export, and deletion to ensure your cognitive health information remains private and secure."
                icon={ShieldCheck}
              />
            </AnimatedSection>
          </div>

          <AnimatedSection className="mt-16 text-center" delay={400}>
            <Link to={user ? "/dashboard" : "/signin"}>
              <Button size="lg" className="gap-2">
                {user ? "Explore Features" : "Get Started"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <AnimatedSection className="flex flex-col items-center gap-4 text-center mb-12">
            <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-sm font-medium text-primary">
              <Star className="mr-1 h-3.5 w-3.5" />
              User Experiences
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                What Our Users Say
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Discover how Holistiq is helping people optimize their cognitive
                enhancement
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <AnimatedSection delay={100}>
              <TestimonialCard
                quote="Holistiq helped me discover that Lion's Mane actually improves my working memory, while other supplements I was taking had no measurable effect."
                author="Michael K."
                role="Software Engineer"
              />
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <TestimonialCard
                quote="I've been able to track how my cognitive performance changes with different supplements and dosages. The data visualization makes it easy to see what's working."
                author="Sarah L."
                role="Medical Student"
              />
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <TestimonialCard
                quote="The ability to track confounding factors alongside supplements has been game-changing. I can now see how my sleep quality affects my cognitive performance."
                author="David R."
                role="Researcher"
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-muted/30">
        <div className="container px-4 md:px-6">
          <AnimatedSection className="flex flex-col items-center gap-4 text-center mb-12">
            <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-sm font-medium text-primary">
              <HelpCircle className="mr-1 h-3.5 w-3.5" />
              Common Questions
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Find answers to common questions about Holistiq
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection className="max-w-3xl mx-auto" delay={200}>
            <FaqAccordion
              items={[
                {
                  id: "faq-1",
                  question: "How does Holistiq measure cognitive performance?",
                  answer:
                    "Holistiq uses scientifically validated cognitive assessments that measure working memory, attention, and processing speed. These tests provide objective metrics that can be tracked over time to measure the effects of supplements.",
                },
                {
                  id: "faq-2",
                  question: "Can I track multiple supplements at once?",
                  answer:
                    "Yes, you can track multiple supplements simultaneously. Our analytics engine helps identify which supplements are contributing to cognitive improvements by analyzing patterns in your performance data.",
                },
                {
                  id: "faq-3",
                  question: "How long does it take to see results?",
                  answer:
                    "This varies by supplement and individual. Some effects may be noticeable after a single dose, while others require consistent use over weeks. Holistiq helps you track both acute and long-term effects.",
                },
                {
                  id: "faq-4",
                  question: "Is my data private and secure?",
                  answer:
                    "Yes, your data privacy is our priority. All personal information and test results are encrypted and stored securely. You maintain full control over your data and can export or delete it at any time.",
                },
                {
                  id: "faq-5",
                  question: "Can I use Holistiq on mobile devices?",
                  answer:
                    "Yes, Holistiq is fully responsive and works on smartphones, tablets, and desktop computers. The cognitive tests are optimized for all screen sizes.",
                },
              ]}
              className="mt-8"
            />
          </AnimatedSection>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
        <div className="container px-4 md:px-6 relative">
          <AnimatedSection className="flex flex-col items-center gap-6 text-center max-w-3xl mx-auto">
            <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-sm font-medium text-primary">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Get Started Today
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                Ready to Track Your Cognitive Enhancement?
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Join Holistiq today and discover if your supplements are
                actually working with data-driven insights.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="gap-2 text-base">
                    <BarChart size={20} /> Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/signin">
                  <Button size="lg" className="gap-2 text-base">
                    <Plus size={20} /> Get Started
                  </Button>
                </Link>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

export default Index;
