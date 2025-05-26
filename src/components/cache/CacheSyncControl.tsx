/**
 * Component for controlling and monitoring cache synchronization
 */
import { useState, useEffect } from "react";
import { cache, DEFAULT_CACHE_CONFIG } from "@/lib/cache";
import { SyncMetrics } from "@/lib/cacheSyncManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, Settings, Layers } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CacheSyncControlProps {
  // Whether to show detailed metrics
  readonly showMetrics?: boolean;

  // Whether to show configuration options
  readonly showConfig?: boolean;
}

/**
 * Component for controlling and monitoring cache synchronization
 */
export function CacheSyncControl({
  showMetrics = true,
  showConfig = true,
}: CacheSyncControlProps) {
  const [syncEnabled, setSyncEnabled] = useState(cache.isSyncEnabled());
  const [activeTabCount, setActiveTabCount] = useState(
    cache.getActiveTabCount(),
  );
  const [metrics, setMetrics] = useState<SyncMetrics>(cache.getSyncMetrics());
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [logLevel, setLogLevel] = useState(DEFAULT_CACHE_CONFIG.logLevel);
  const [resolveConflicts, setResolveConflicts] = useState(
    DEFAULT_CACHE_CONFIG.resolveConflicts,
  );
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(
    DEFAULT_CACHE_CONFIG.heartbeatEnabled,
  );

  // Update metrics periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setMetrics(cache.getSyncMetrics());
      setActiveTabCount(cache.getActiveTabCount());
      setSyncEnabled(cache.isSyncEnabled());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Handle sync toggle
  const handleSyncToggle = (checked: boolean) => {
    setSyncEnabled(checked);
    cache.setSyncEnabled(checked);
  };

  // Handle log level change
  const handleLogLevelChange = (value: string) => {
    setLogLevel(value as "none" | "error" | "warn" | "info" | "debug");
    cache.configure({
      logLevel: value as "none" | "error" | "warn" | "info" | "debug",
    });
  };

  // Handle resolve conflicts toggle
  const handleResolveConflictsToggle = (checked: boolean) => {
    setResolveConflicts(checked);
    cache.configure({ resolveConflicts: checked });
  };

  // Handle heartbeat toggle
  const handleHeartbeatToggle = (checked: boolean) => {
    setHeartbeatEnabled(checked);
    cache.configure({ heartbeatEnabled: checked });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Cache Synchronization</span>
          <Badge variant="outline" className="ml-2 bg-blue-50">
            <Layers className="h-3 w-3 mr-1" />
            {activeTabCount} {activeTabCount === 1 ? "tab" : "tabs"} active
          </Badge>
        </CardTitle>
        <CardDescription>
          Keep cache data consistent across multiple browser tabs
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="sync-enabled"
              checked={syncEnabled}
              onCheckedChange={handleSyncToggle}
            />
            <Label htmlFor="sync-enabled">Enable synchronization</Label>
          </div>
        </div>

        {showMetrics && metrics && (
          <>
            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Messages Sent
                </span>
                <span className="text-xl font-semibold">
                  {metrics.messagesSent}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Messages Received
                </span>
                <span className="text-xl font-semibold">
                  {metrics.messagesReceived}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Conflicts</span>
                <span className="text-xl font-semibold">
                  {metrics.conflictsDetected}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Errors</span>
                <span className="text-xl font-semibold">{metrics.errors}</span>
              </div>
            </div>

            {metrics.lastSyncTime != null && (
              <div className="text-sm text-muted-foreground mb-4">
                Last sync: {new Date(metrics.lastSyncTime).toLocaleTimeString()}
              </div>
            )}
          </>
        )}

        {showConfig && (
          <>
            <Separator className="my-4" />

            <Collapsible
              open={isConfigOpen}
              onOpenChange={setIsConfigOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex w-full justify-between p-0"
                >
                  <span className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuration Options
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isConfigOpen ? "Hide" : "Show"}
                  </span>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="log-level">Console Log Level</Label>
                    <Select
                      value={logLevel}
                      onValueChange={handleLogLevelChange}
                    >
                      <SelectTrigger className="w-[180px]" id="log-level">
                        <SelectValue placeholder="Select log level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Production)</SelectItem>
                        <SelectItem value="error">Errors Only</SelectItem>
                        <SelectItem value="warn">Warnings & Errors</SelectItem>
                        <SelectItem value="info">Info & Above</SelectItem>
                        <SelectItem value="debug">Debug (Verbose)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="resolve-conflicts">
                      Resolve conflicts automatically
                    </Label>
                    <Switch
                      id="resolve-conflicts"
                      checked={resolveConflicts}
                      onCheckedChange={handleResolveConflictsToggle}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="heartbeat">Enable tab heartbeat</Label>
                    <Switch
                      id="heartbeat"
                      checked={heartbeatEnabled}
                      onCheckedChange={handleHeartbeatToggle}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        <Database className="h-3 w-3 mr-1" />
        Synchronization ensures consistent data across multiple browser tabs
      </CardFooter>
    </Card>
  );
}
