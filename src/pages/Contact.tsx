import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Mail,
  MessageSquare,
  Send,
  User,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot field
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [formIsValid, setFormIsValid] = useState(false);
  const { toast } = useToast();

  // Email validation regex - memoized to prevent re-creation on each render
  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  // Helper function to get validation classes for input fields
  const getInputValidationClass = (
    isValid: boolean,
    isDirty: boolean,
  ): string => {
    if (!isDirty) return ""; // No validation styling if field is empty
    return isValid
      ? "border-green-500/50 focus-visible:ring-green-500/20"
      : "border-destructive/50 focus-visible:ring-destructive/20";
  };

  // Generate a simple CAPTCHA question
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Validate form fields in real-time
  useEffect(() => {
    // Check if all required fields are filled and valid
    const isNameValid = name.trim().length > 0;
    const isEmailValid = email.trim().length > 0 && emailRegex.test(email);
    const isSubjectValid = subject.trim().length > 0;
    const isMessageValid = message.trim().length > 0;
    const isCaptchaValid =
      captchaValue === captchaAnswer && captchaValue.trim().length > 0;

    // Update form validity state
    setFormIsValid(
      isNameValid &&
        isEmailValid &&
        isSubjectValid &&
        isMessageValid &&
        isCaptchaValid &&
        privacyConsent,
    );
  }, [
    name,
    email,
    subject,
    message,
    captchaValue,
    captchaAnswer,
    privacyConsent,
    emailRegex,
  ]);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    setCaptchaQuestion(`What is ${num1} + ${num2}?`);
    setCaptchaAnswer((num1 + num2).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Double-check form validity (in case someone tries to submit programmatically)
    if (!formIsValid && !website) {
      toast({
        title: "Form Incomplete",
        description: "Please complete all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Check if honeypot field is filled (bot detection)
    if (website) {
      console.log("Bot submission detected");
      // Pretend success but don't actually submit
      toast({
        title: "Message Sent",
        description: "Thank you for contacting us. We'll get back to you soon!",
      });
      return;
    }

    // Verify CAPTCHA
    if (captchaValue !== captchaAnswer) {
      toast({
        title: "Verification Failed",
        description: "Please enter the correct answer to the math question.",
        variant: "destructive",
      });
      generateCaptcha(); // Generate a new CAPTCHA
      setCaptchaValue("");
      return;
    }

    // Check privacy consent
    if (!privacyConsent) {
      toast({
        title: "Consent Required",
        description: "Please agree to our privacy policy to submit the form.",
        variant: "destructive",
      });
      return;
    }

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastSubmission = now - lastSubmissionTime;

    if (timeSinceLastSubmission < 60000 && submissionCount > 2) {
      // 1 minute and more than 2 submissions
      toast({
        title: "Too Many Attempts",
        description: "Please wait a moment before submitting again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "Thank you for contacting us. We'll get back to you soon!",
      });

      // Update submission tracking
      setSubmissionCount((prev) => prev + 1);
      setLastSubmissionTime(Date.now());

      // Reset form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setCaptchaValue("");
      setPrivacyConsent(false);
      generateCaptcha(); // Generate a new CAPTCHA
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-sm font-medium text-primary mb-4">
              <MessageSquare className="mr-1 h-3.5 w-3.5" />
              Get in Touch
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions or feedback? We'd love to hear from you. Reach out
              to our team and we'll get back to you as soon as possible.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Contact Form */}
            <AnimatedSection
              className="bg-card rounded-xl p-8 border border-border shadow-sm"
              delay={100}
            >
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`pl-10 ${getInputValidationClass(name.trim().length > 0, name.trim() !== "")}`}
                      required
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <User size={16} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 ${getInputValidationClass(emailRegex.test(email), email.trim() !== "")}`}
                      required
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail size={16} />
                    </div>
                  </div>
                </div>

                {/* Honeypot field - hidden from humans but visible to bots */}
                <div className="opacity-0 absolute top-0 left-0 h-0 w-0 -z-10 overflow-hidden">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="text"
                    autoComplete="off"
                    tabIndex={-1}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="How can we help you?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={getInputValidationClass(
                      subject.trim().length > 0,
                      subject.trim() !== "",
                    )}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={getInputValidationClass(
                      message.trim().length > 0,
                      message.trim() !== "",
                    )}
                    rows={5}
                    required
                  />
                </div>

                {/* CAPTCHA verification */}
                <div className="space-y-2 p-4 bg-muted/30 rounded-md border border-border">
                  <Label htmlFor="captcha" className="font-medium">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>Verification</span>
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Please solve this simple math problem to verify you're
                    human:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <span className="font-medium">{captchaQuestion}</span>
                    <Input
                      id="captcha"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter answer"
                      value={captchaValue}
                      onChange={(e) => setCaptchaValue(e.target.value)}
                      className={`max-w-[150px] ${getInputValidationClass(
                        captchaValue === captchaAnswer &&
                          captchaValue.trim() !== "",
                        captchaValue.trim() !== "",
                      )}`}
                      required
                    />
                  </div>
                </div>

                {/* Privacy consent */}
                <div
                  className={`flex items-start space-x-2 p-3 rounded-md ${privacyConsent ? "bg-green-500/5" : ""}`}
                >
                  <Checkbox
                    id="privacy"
                    checked={privacyConsent}
                    onCheckedChange={(checked) =>
                      setPrivacyConsent(checked === true)
                    }
                    className={
                      privacyConsent
                        ? "border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-primary-foreground"
                        : ""
                    }
                    required
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="privacy"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the privacy policy
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Your information will be processed according to our
                      privacy policy. We will only use it to respond to your
                      inquiry.
                    </p>
                  </div>
                </div>

                {/* Rate limiting notice */}
                <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-md">
                  <div className="flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="font-medium">Submission limits:</span>
                  </div>
                  <p>
                    To prevent spam, we limit the number of contact form
                    submissions. Please allow up to 48 hours for a response
                    before submitting again.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !formIsValid}
                  variant={formIsValid ? "default" : "outline"}
                >
                  {(() => {
                    if (isSubmitting) {
                      return <>Sending...</>;
                    }

                    if (formIsValid) {
                      return (
                        <>
                          Send Message <Send className="ml-2 h-4 w-4" />
                        </>
                      );
                    }

                    return (
                      <>
                        Complete All Fields{" "}
                        <AlertTriangle className="ml-2 h-4 w-4" />
                      </>
                    );
                  })()}
                </Button>

                {/* Form validation status message */}
                {!formIsValid && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Please complete all required fields to enable the submit
                    button
                  </p>
                )}
              </form>
            </AnimatedSection>

            {/* Contact Information */}
            <AnimatedSection delay={200}>
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>

              <div className="space-y-8">
                <div className="bg-primary/5 p-6 rounded-lg">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Contact Form</h3>
                  <p className="text-muted-foreground mb-3">
                    The fastest way to reach us is through our secure contact
                    form.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Our team reviews all submissions and will respond to your
                    inquiry as soon as possible.
                  </p>
                </div>

                <div className="bg-primary/5 p-6 rounded-lg">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <HelpCircle className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">FAQ</h3>
                  <p className="text-muted-foreground mb-3">
                    Find answers to common questions in our FAQ section:
                  </p>
                  <Link
                    to="/faq"
                    className="text-primary hover:underline flex items-center"
                  >
                    View FAQ <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="mt-8 p-6 border border-border rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Response Time</h3>
                <p className="text-muted-foreground mb-4">
                  We strive to respond to all inquiries within 24-48 hours
                  during business days. Thank you for your patience.
                </p>
                <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-md">
                  <p className="font-medium mb-1">Privacy Notice</p>
                  <p>
                    All information submitted through this form is encrypted and
                    stored securely. We do not share your information with third
                    parties and only use it to respond to your inquiry.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
