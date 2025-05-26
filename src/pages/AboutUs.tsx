import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  Brain,
  ShieldCheck,
  Code,
  Sparkles,
  Lightbulb,
  Rocket,
  Target,
  Zap,
  Star,
  Quote,
} from "lucide-react";
import { AnimatedSection } from "@/components/ui/animated-section";

export default function AboutUs() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-sm font-medium text-primary mb-4">
              <Users className="mr-1 h-3.5 w-3.5" />
              Our Team
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Us</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Meet the team behind Holistiq and discover our mission to
              revolutionize how we measure the effectiveness of supplements.
            </p>
          </AnimatedSection>

          {/* Main Content */}
          <AnimatedSection
            className="bg-card rounded-xl p-8 border border-border shadow-sm mb-16"
            delay={100}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left column with main text */}
              <div className="md:col-span-2 space-y-6">
                <div className="border-l-4 border-primary/50 pl-6 py-2">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Our Story
                  </h3>
                  <p className="text-lg text-foreground/90">
                    At the heart of innovation lies a passion for progress, and
                    that's exactly what drives us.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-foreground/80 leading-relaxed">
                    We are a diverse team of three IT professionals, each
                    bringing a unique set of skills to the table—ranging from{" "}
                    <span className="font-semibold text-primary/90">
                      AI Engineering
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-primary/90">
                      Cyber Security
                    </span>{" "}
                    and{" "}
                    <span className="font-semibold text-primary/90">
                      Software Development
                    </span>
                    .
                  </p>

                  <p className="text-foreground/80 leading-relaxed">
                    Together, we are on a mission to revolutionize how we
                    measure the effectiveness of supplements through data-driven
                    insights and objective measurements.
                  </p>
                </div>

                <div className="bg-primary/5 p-5 rounded-lg border border-primary/10">
                  <h4 className="font-semibold text-lg mb-2 flex items-center">
                    <Sparkles className="h-5 w-5 text-primary mr-2" />
                    What brings us together?
                  </h4>
                  <p className="text-foreground/80 leading-relaxed">
                    A shared belief that science and technology can unlock a
                    more personalized, data-driven approach to wellness. With a
                    background in the supplement industry, we bring valuable
                    real-world insights into its complexities, helping bridge
                    the gap between technology and wellness.
                  </p>
                </div>

                <p className="text-foreground/80 leading-relaxed">
                  Whether it's using AI to provide deeper insights, ensuring our
                  platform's security, or crafting a seamless user experience,
                  we're committed to creating a web app that empowers people to
                  understand how supplements work for them.
                </p>
              </div>

              {/* Right column with quote and highlight */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl border border-primary/20 shadow-sm">
                  <Quote className="h-10 w-10 text-primary/40 mb-4" />
                  <p className="text-xl font-medium italic text-foreground/90 mb-4">
                    "Welcome to the future of wellness—where technology meets
                    health."
                  </p>
                  <div className="flex justify-end">
                    <div className="h-1 w-16 bg-primary/40 rounded-full"></div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                  <h4 className="font-bold text-lg mb-3 flex items-center">
                    <Target className="h-5 w-5 text-primary mr-2" />
                    Our Approach
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="bg-primary/10 rounded-full p-1 mr-3 mt-0.5">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground/80">
                        Data-driven insights
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary/10 rounded-full p-1 mr-3 mt-0.5">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground/80">
                        Objective measurements
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary/10 rounded-full p-1 mr-3 mt-0.5">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground/80">
                        Personalized recommendations
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-center p-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-primary fill-primary" />
                    <Star className="h-5 w-5 text-primary fill-primary" />
                    <Star className="h-5 w-5 text-primary fill-primary" />
                    <Star className="h-5 w-5 text-primary fill-primary" />
                    <Star className="h-5 w-5 text-primary fill-primary" />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Our Expertise Section */}
          <AnimatedSection className="mb-16" delay={200}>
            <h2 className="text-3xl font-bold mb-8 text-center">
              Our Expertise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* AI Engineering */}
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Brain className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Engineering</h3>
                <p className="text-muted-foreground">
                  We leverage artificial intelligence to analyze cognitive test
                  results and supplement effectiveness, providing personalized
                  insights that help you optimize your supplement regimen.
                </p>
              </div>

              {/* Cyber Security */}
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Cyber Security</h3>
                <p className="text-muted-foreground">
                  Your data security is our priority. We implement robust
                  security measures to protect your personal information and
                  test results, ensuring a safe and private experience.
                </p>
              </div>

              {/* Software Development */}
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Code className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Software Development</h3>
                <p className="text-muted-foreground">
                  We build intuitive, user-friendly interfaces that make
                  tracking your supplements and cognitive performance simple and
                  enjoyable, with a focus on accessibility and ease of use.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Our Mission Section */}
          <AnimatedSection
            className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8 border border-border shadow-sm mb-16"
            delay={300}
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/3 flex justify-center">
                <div className="bg-background rounded-full p-6 shadow-md">
                  <Lightbulb className="h-24 w-24 text-primary" />
                </div>
              </div>
              <div className="md:w-2/3">
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-lg mb-4">
                  We believe that everyone deserves to know if their supplements
                  are actually working. Our mission is to provide objective,
                  data-driven insights that empower you to make informed
                  decisions about your cognitive health.
                </p>
                <p className="text-lg">
                  By combining cognitive science with modern technology, we're
                  creating a future where supplement effectiveness is no longer
                  a mystery but a measurable reality.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* CTA Section */}
          <AnimatedSection
            className="text-center bg-card rounded-xl p-8 border border-border shadow-sm"
            delay={400}
          >
            <h2 className="text-2xl font-bold mb-3">Join Us on This Journey</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Ready to discover if your supplements are actually working? Start
              tracking your cognitive performance with Holistiq today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signin">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
