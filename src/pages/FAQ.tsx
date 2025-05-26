import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FaqPage() {
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const faqItems: FAQItem[] = [
    {
      question: "What is Holistiq?",
      answer:
        "Holistiq is a platform that helps you track the effectiveness of supplements on your cognitive performance through standardized tests and data analysis. We provide tools to log your supplement intake, measure your cognitive performance, and analyze the correlation between the two.",
      category: "general",
    },
    {
      question: "How do the cognitive tests work?",
      answer:
        "Our cognitive tests are designed to measure different aspects of cognitive function, including memory, attention, processing speed, and reaction time. Each test is standardized and takes only a few minutes to complete. We recommend taking tests regularly to establish a baseline and track changes over time.",
      category: "tests",
    },
    {
      question: "Is my data private and secure?",
      answer:
        "Yes, your privacy is our priority. All your data is encrypted and stored securely. We do not share your personal information with third parties without your explicit consent. You can delete your account and all associated data at any time.",
      category: "privacy",
    },
    {
      question: "How often should I take the cognitive tests?",
      answer:
        "For optimal results, we recommend taking tests 2-3 times per week. Consistency is key to establishing reliable patterns. Try to take tests at similar times of day to minimize the impact of circadian rhythm on your results.",
      category: "tests",
    },
    {
      question: "Can I track multiple supplements at once?",
      answer:
        "Yes, you can track as many supplements as you want. Our analytics engine is designed to identify correlations between specific supplements and changes in cognitive performance, even when multiple supplements are being taken simultaneously.",
      category: "supplements",
    },
    {
      question: "What are confounding factors and why should I track them?",
      answer:
        "Confounding factors are variables that might affect your cognitive performance independently of supplements, such as sleep quality, stress levels, exercise, and diet. Tracking these factors helps our analytics engine provide more accurate insights about supplement effectiveness by accounting for these variables.",
      category: "tracking",
    },
    {
      question: "How long does it take to see results?",
      answer:
        "The time to see results varies depending on the supplement and individual factors. Some effects may be noticeable within days, while others might take weeks or months. We recommend tracking for at least 30 days to start seeing meaningful patterns in your data.",
      category: "results",
    },
    {
      question: "Is Holistiq free to use?",
      answer:
        "Holistiq offers both free and premium plans. The free plan includes basic tracking and testing features, while the premium plan offers advanced analytics, unlimited supplement tracking, and personalized insights. Visit our pricing page for more details.",
      category: "general",
    },
    {
      question: "Can I export my data?",
      answer:
        "Yes, premium users can export their data in various formats, including CSV and PDF. This allows you to share your results with healthcare providers or use the data in other applications.",
      category: "privacy",
    },
    {
      question: "Which supplements does Holistiq track?",
      answer:
        "Holistiq can track any supplement you're taking, with a special focus on cognitive enhancers (nootropics) like Bacopa Monnieri, Lion's Mane, Ginkgo Biloba, Omega-3, and many others. Our database includes information on dosage, typical effects, and scientific research for many popular supplements.",
      category: "supplements",
    },
  ];

  const categories = [
    { id: "all", name: "All Questions" },
    { id: "general", name: "General" },
    { id: "tests", name: "Cognitive Tests" },
    { id: "supplements", name: "Supplements" },
    { id: "tracking", name: "Tracking" },
    { id: "results", name: "Results" },
    { id: "privacy", name: "Privacy & Data" },
  ];

  const filteredFAQs = faqItems.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-background">
      {/* Removed redundant navigation - now using EnhancedHeader from Layout */}

      {/* Hero Section with improved styling */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex h-6 items-center rounded-full bg-primary/10 px-3 text-sm font-medium text-primary mb-4">
              <Search className="mr-1 h-3.5 w-3.5" />
              Find Answers
            </div>
            <h1 className="text-4xl font-bold tracking-tighter md:text-5xl mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about Holistiq, cognitive
              testing, and supplement tracking.
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search questions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Items using improved styling */}
          <div className="space-y-4 mb-16">
            {filteredFAQs.length > 0 ? (
              <div className="rounded-lg border border-border bg-card">
                {filteredFAQs.map((item, index) => (
                  <div
                    key={`faq-item-${item.question.substring(0, 20)}-${item.category}`}
                    className={
                      index !== filteredFAQs.length - 1
                        ? "border-b border-border"
                        : ""
                    }
                  >
                    <button
                      className="w-full px-6 py-4 flex justify-between items-center cursor-pointer text-left"
                      onClick={() =>
                        setOpenItem(openItem === index ? null : index)
                      }
                      aria-expanded={openItem === index}
                      aria-controls={`faq-content-${item.question.substring(0, 20)}-${item.category}`}
                    >
                      <h3 className="font-medium text-foreground">
                        {item.question}
                      </h3>
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                          openItem === index
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {openItem === index ? (
                          <span
                            className="text-lg font-medium leading-none"
                            aria-hidden="true"
                          >
                            −
                          </span>
                        ) : (
                          <span
                            className="text-lg font-medium leading-none"
                            aria-hidden="true"
                          >
                            +
                          </span>
                        )}
                      </div>
                    </button>
                    {openItem === index && (
                      <div
                        id={`faq-content-${item.question.substring(0, 20)}-${item.category}`}
                        className="px-6 py-4 bg-muted/30 border-t border-border"
                      >
                        <p className="text-muted-foreground">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg border border-border">
                <p className="text-muted-foreground mb-2">
                  No results found for "{searchQuery}"
                </p>
                <button
                  className="text-primary hover:underline inline-flex items-center"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                >
                  <span>Clear search and show all questions</span>
                </button>
              </div>
            )}
          </div>

          {/* CTA Section with improved styling */}
          <div className="text-center bg-card rounded-xl p-8 border border-border shadow-sm">
            <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Get started with Holistiq today and discover how our platform can
              help you optimize your cognitive performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signin">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
