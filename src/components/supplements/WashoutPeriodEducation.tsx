import React from 'react';
import { 
  Clock, 
  Info, 
  AlertCircle, 
  Brain, 
  BarChart, 
  Calendar, 
  Pill
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WashoutPeriodEducationProps {
  variant?: 'compact' | 'detailed' | 'accordion';
  className?: string;
}

export function WashoutPeriodEducation({ 
  variant = 'compact',
  className = ''
}: WashoutPeriodEducationProps) {
  
  // Basic explanation for compact view
  const basicExplanation = (
    <Alert className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>What is a washout period?</AlertTitle>
      <AlertDescription>
        A washout period is when you temporarily stop taking a supplement to allow its effects to dissipate from your system. 
        This creates a "clean slate" that helps accurately measure the supplement's true effects when you resume taking it.
      </AlertDescription>
    </Alert>
  );
  
  // Detailed explanation with benefits
  const detailedExplanation = (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Understanding Washout Periods</CardTitle>
        </div>
        <CardDescription>
          Why washout periods are essential for accurate supplement tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          A <strong>washout period</strong> is a deliberate break from taking a supplement to allow its effects to fully clear from your system. 
          This practice is widely used in clinical research and can significantly improve your personal supplement tracking.
        </p>
        
        <h3 className="text-lg font-medium mt-4">Key Benefits:</h3>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <strong>Establish true baselines</strong> - Measure your cognitive performance without any supplement influence
          </li>
          <li>
            <strong>Differentiate between supplements</strong> - Prevent overlapping effects when switching supplements
          </li>
          <li>
            <strong>Assess long-term effects</strong> - Determine if benefits persist after stopping a supplement
          </li>
          <li>
            <strong>Prevent tolerance</strong> - For some supplements, cycling on and off can prevent diminishing returns
          </li>
          <li>
            <strong>Identify dependency</strong> - Reveal if there are withdrawal effects or performance declines
          </li>
        </ul>
        
        <div className="bg-secondary/30 p-4 rounded-lg mt-4">
          <h4 className="font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Recommended Washout Durations
          </h4>
          <p className="text-sm mt-1">
            Most cognitive supplements require 1-4 weeks to fully clear from your system. 
            Water-soluble supplements (like B vitamins) typically clear faster than fat-soluble ones (like vitamin D).
            Check the specific supplement guidelines for more precise recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
  
  // Accordion view with comprehensive information
  const accordionExplanation = (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem value="what-is-washout">
        <AccordionTrigger className="text-lg font-medium">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            What is a washout period?
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-base">
          <p className="mb-3">
            A washout period is a deliberate break from taking a supplement to allow its effects to fully clear from your system.
            This practice is widely used in clinical research and can significantly improve your personal supplement tracking.
          </p>
          <p>
            By temporarily stopping a supplement, you create a "clean slate" that helps accurately measure the supplement's true effects
            when you resume taking it or when you start a different supplement.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="why-important">
        <AccordionTrigger className="text-lg font-medium">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Why are washout periods important?
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-base">
          <ul className="space-y-3 list-disc pl-5">
            <li>
              <strong>Establish true baselines</strong> - Measure your cognitive performance without any supplement influence
            </li>
            <li>
              <strong>Differentiate between supplements</strong> - Prevent overlapping effects when switching supplements
            </li>
            <li>
              <strong>Assess long-term effects</strong> - Determine if benefits persist after stopping a supplement
            </li>
            <li>
              <strong>Prevent tolerance</strong> - For some supplements, cycling on and off can prevent diminishing returns
            </li>
            <li>
              <strong>Identify dependency</strong> - Reveal if there are withdrawal effects or performance declines
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="recommended-durations">
        <AccordionTrigger className="text-lg font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recommended washout durations
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-base">
          <p className="mb-3">
            The optimal washout period varies by supplement type, but here are general guidelines:
          </p>
          <ul className="space-y-3 list-disc pl-5">
            <li>
              <strong>Water-soluble supplements</strong> (B vitamins, vitamin C): 1-2 weeks
            </li>
            <li>
              <strong>Fat-soluble supplements</strong> (vitamins A, D, E, K): 2-4 weeks
            </li>
            <li>
              <strong>Herbal supplements</strong> (Ginkgo, Bacopa): 2-3 weeks
            </li>
            <li>
              <strong>Adaptogens</strong> (Ashwagandha, Rhodiola): 2 weeks
            </li>
            <li>
              <strong>Nootropics</strong> (Racetams, Noopept): 1-3 weeks
            </li>
            <li>
              <strong>Minerals</strong> (Magnesium, Zinc): 1-2 weeks
            </li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            Note: These are general guidelines. Always consult with a healthcare professional for personalized advice.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="best-practices">
        <AccordionTrigger className="text-lg font-medium">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Best practices for effective tracking
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-base">
          <ul className="space-y-3 list-disc pl-5">
            <li>
              <strong>Take cognitive tests</strong> during the washout period to establish your baseline performance
            </li>
            <li>
              <strong>Track confounding factors</strong> like sleep, stress, and exercise during washout periods
            </li>
            <li>
              <strong>Be consistent with timing</strong> - Try to take tests at the same time of day
            </li>
            <li>
              <strong>Complete the full duration</strong> - Don't cut washout periods short
            </li>
            <li>
              <strong>Consider cycling supplements</strong> with scheduled washout periods (e.g., 8 weeks on, 2 weeks off)
            </li>
            <li>
              <strong>Use washout periods between different supplements</strong> to prevent overlapping effects
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
  
  // Return the appropriate variant
  switch (variant) {
    case 'compact':
      return basicExplanation;
    case 'detailed':
      return detailedExplanation;
    case 'accordion':
      return accordionExplanation;
    default:
      return basicExplanation;
  }
}
