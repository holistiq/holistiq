import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Brain, 
  BarChart, 
  Calendar, 
  Pill,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WashoutPeriodEducation } from '@/components/supplements/WashoutPeriodEducation';

export default function WashoutPeriodGuide() {
  return (
    <div className="container py-8 md:py-12 max-w-screen-xl">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Washout Period Guide</h1>
            <p className="text-muted-foreground mt-1">
              Understanding how to effectively use washout periods for accurate supplement tracking
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/supplements">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Supplements
              </Button>
            </Link>
            <Link to="/log-washout-period">
              <Button className="gap-2">
                <Clock className="h-4 w-4" />
                Start Washout Period
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">What is a Washout Period?</CardTitle>
            <CardDescription>
              A fundamental concept for accurate supplement tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              A <strong>washout period</strong> is a deliberate break from taking a supplement to allow its effects to fully clear from your system.
              This practice is widely used in clinical research and can significantly improve your personal supplement tracking.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-secondary/30 p-6 rounded-lg">
                <h3 className="text-xl font-medium flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Benefits of Washout Periods
                </h3>
                <ul className="space-y-3 list-disc pl-5">
                  <li>Establish true cognitive baselines</li>
                  <li>Differentiate between supplement effects</li>
                  <li>Assess long-term benefits</li>
                  <li>Prevent tolerance development</li>
                  <li>Identify potential dependencies</li>
                  <li>Improve statistical significance of your tracking</li>
                </ul>
              </div>
              
              <div className="bg-secondary/30 p-6 rounded-lg">
                <h3 className="text-xl font-medium flex items-center gap-2 mb-4">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Common Misconceptions
                </h3>
                <ul className="space-y-3 list-disc pl-5">
                  <li>Washout periods are not just for negative reactions</li>
                  <li>They're not only for prescription medications</li>
                  <li>A few days is usually not enough time</li>
                  <li>Washout periods don't mean supplements aren't working</li>
                  <li>They're not just for scientific studies</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* When to Use Washout Periods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              When to Use Washout Periods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Washout periods are particularly valuable in the following scenarios:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">When Starting a New Supplement</h3>
                <p className="text-sm text-muted-foreground">
                  Take a washout period from your current supplements before starting a new one to establish a clean baseline and accurately measure its effects.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">When Switching Supplements</h3>
                <p className="text-sm text-muted-foreground">
                  Include a washout period between different supplements to prevent overlapping effects that could confuse your analysis.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">For Cycling Supplements</h3>
                <p className="text-sm text-muted-foreground">
                  Many supplements benefit from cycling (periods of use followed by breaks) to prevent tolerance and maintain effectiveness.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">To Verify Effectiveness</h3>
                <p className="text-sm text-muted-foreground">
                  If you're unsure if a supplement is working, a washout period can help you observe any changes in cognitive performance when you stop taking it.
                </p>
              </div>
            </div>
            
            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Note</AlertTitle>
              <AlertDescription>
                Always consult with a healthcare professional before stopping any prescribed medications or supplements that you take for medical conditions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        {/* Recommended Durations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Recommended Washout Durations
            </CardTitle>
            <CardDescription>
              How long should your washout period last?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              The optimal washout period varies by supplement type. Here are general guidelines based on how supplements are metabolized and eliminated from the body:
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-secondary">
                    <th className="border p-3 text-left">Supplement Type</th>
                    <th className="border p-3 text-left">Recommended Duration</th>
                    <th className="border p-3 text-left">Examples</th>
                    <th className="border p-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-3 font-medium">Water-soluble vitamins</td>
                    <td className="border p-3">1-2 weeks</td>
                    <td className="border p-3">B vitamins, Vitamin C</td>
                    <td className="border p-3">Cleared relatively quickly through urine</td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-medium">Fat-soluble vitamins</td>
                    <td className="border p-3">2-4 weeks</td>
                    <td className="border p-3">Vitamins A, D, E, K</td>
                    <td className="border p-3">Stored in fat tissue, slower elimination</td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-medium">Herbal supplements</td>
                    <td className="border p-3">2-3 weeks</td>
                    <td className="border p-3">Ginkgo Biloba, Bacopa Monnieri</td>
                    <td className="border p-3">Effects may persist after elimination</td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-medium">Adaptogens</td>
                    <td className="border p-3">2 weeks</td>
                    <td className="border p-3">Ashwagandha, Rhodiola Rosea</td>
                    <td className="border p-3">Effects on stress response systems</td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-medium">Synthetic nootropics</td>
                    <td className="border p-3">1-3 weeks</td>
                    <td className="border p-3">Racetams, Noopept</td>
                    <td className="border p-3">Varies widely by specific compound</td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-medium">Minerals</td>
                    <td className="border p-3">1-2 weeks</td>
                    <td className="border p-3">Magnesium, Zinc</td>
                    <td className="border p-3">Depends on current body stores</td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-medium">Mushroom extracts</td>
                    <td className="border p-3">2 weeks</td>
                    <td className="border p-3">Lion's Mane, Reishi</td>
                    <td className="border p-3">Immunomodulating effects may persist</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              Note: These are general guidelines. The optimal duration can vary based on individual factors like metabolism, dosage, duration of use, and the specific supplement formulation.
            </p>
          </CardContent>
        </Card>
        
        {/* Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart className="h-6 w-6 text-primary" />
              Best Practices for Effective Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Follow these best practices to get the most value from your washout periods:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Take Cognitive Tests
                </h3>
                <p className="text-sm text-muted-foreground">
                  Perform cognitive tests regularly during the washout period to establish your baseline performance without the supplement.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Track Confounding Factors
                </h3>
                <p className="text-sm text-muted-foreground">
                  Continue tracking sleep, stress, exercise, and other factors that might affect your cognitive performance.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Be Consistent with Timing
                </h3>
                <p className="text-sm text-muted-foreground">
                  Take cognitive tests at the same time of day to minimize the impact of circadian rhythms on your results.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Complete the Full Duration
                </h3>
                <p className="text-sm text-muted-foreground">
                  Don't cut washout periods short. Allow the full recommended time for the supplement to clear your system.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  Consider Cycling
                </h3>
                <p className="text-sm text-muted-foreground">
                  For many supplements, scheduled cycles (e.g., 8 weeks on, 2 weeks off) can prevent tolerance and maintain effectiveness.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <BarChart className="h-4 w-4 text-primary" />
                  Compare Before and After
                </h3>
                <p className="text-sm text-muted-foreground">
                  Compare your cognitive performance during the washout period with your performance while taking the supplement.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            <Link to="/log-washout-period">
              <Button size="lg" className="gap-2">
                <Clock className="h-4 w-4" />
                Start Tracking a Washout Period
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
