import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { NBackGrid } from './NBackGrid';

interface NBackInstructionsProps {
  nBackLevel: 2 | 3;
  onReady: () => void;
  onCancel?: () => void;
}

export function NBackInstructions({ nBackLevel, onReady, onCancel }: NBackInstructionsProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{nBackLevel}-Back Test Instructions</CardTitle>
        <CardDescription>
          This test measures your working memory capacity and attention.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">How it works:</h3>
          <p>
            You'll see squares appearing on a 3×3 grid one at a time. Your task is to identify when the
            <strong> current position matches the position from {nBackLevel} steps earlier</strong>.
          </p>
          
          <div className="bg-secondary/30 p-4 rounded-md space-y-4">
            <h4 className="font-medium">Example sequence:</h4>
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Position 1</p>
                  <NBackGrid highlightedPosition={0} size="sm" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Position 2</p>
                  <NBackGrid highlightedPosition={4} size="sm" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Position 3</p>
                  <NBackGrid highlightedPosition={8} size="sm" />
                </div>
              </div>
              
              {nBackLevel === 2 && (
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Position 4</p>
                    <NBackGrid highlightedPosition={0} size="sm" />
                    <p className="text-xs font-medium text-primary mt-1">Match with position 2! ✓</p>
                  </div>
                </div>
              )}
              
              {nBackLevel === 3 && (
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Position 4</p>
                    <NBackGrid highlightedPosition={2} size="sm" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Position 5</p>
                    <NBackGrid highlightedPosition={4} size="sm" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Position 6</p>
                    <NBackGrid highlightedPosition={0} size="sm" />
                    <p className="text-xs font-medium text-primary mt-1">Match with position 3! ✓</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">How to respond:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Press the <strong>spacebar</strong> or the <strong>Match button</strong> when you see a position that matches the one from {nBackLevel} steps earlier</li>
            <li>Try to respond as quickly and accurately as possible</li>
            <li>Don't worry if you miss some - this test is designed to be challenging</li>
          </ul>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Test environment:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Find a quiet place with minimal distractions</li>
            <li>The test will run for approximately 3 minutes</li>
            <li>For best results, use fullscreen mode</li>
            <li>Avoid switching tabs or windows during the test</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={onReady}>
          I'm Ready
        </Button>
      </CardFooter>
    </Card>
  );
}
