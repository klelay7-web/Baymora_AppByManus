import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Chat() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Chat with Baymora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block p-4 bg-primary/10 rounded-lg mb-4">
                  <svg
                    className="w-12 h-12 text-primary animate-spin"
                    viewBox="0 0 50 50"
                  >
                    <circle
                      className="opacity-25"
                      cx="25"
                      cy="25"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="none"
                    />
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="none"
                      strokeDasharray="31.4 31.4"
                      opacity="0.75"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Chat Interface Coming Soon</h3>
                <p className="text-muted-foreground">
                  The chat interface is being built. Check back soon to start your journey!
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              This is where you'll communicate with Baymora to plan your next amazing trip.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
