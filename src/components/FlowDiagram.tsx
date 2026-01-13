import { Clock, MessageSquare, Brain, Check, AlertCircle, Send } from "lucide-react";

export function FlowDiagram() {
  return (
    <div className="relative py-8">
      {/* Flow Steps */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 ring-4 ring-background">
            <Clock className="w-7 h-7 text-primary" />
          </div>
          <span className="text-sm font-medium">9:00 PM</span>
          <span className="text-xs text-muted-foreground">Daily trigger</span>
        </div>
        
        {/* Arrow */}
        <div className="hidden md:block w-12 h-0.5 bg-border" />
        <div className="md:hidden h-8 w-0.5 bg-border" />
        
        {/* Step 2 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-3 ring-4 ring-background">
            <Brain className="w-7 h-7 text-accent" />
          </div>
          <span className="text-sm font-medium">Gemini</span>
          <span className="text-xs text-muted-foreground">Generate message</span>
        </div>
        
        {/* Arrow */}
        <div className="hidden md:block w-12 h-0.5 bg-border" />
        <div className="md:hidden h-8 w-0.5 bg-border" />
        
        {/* Step 3 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-3 ring-4 ring-background">
            <Send className="w-7 h-7 text-green-600" />
          </div>
          <span className="text-sm font-medium">WhatsApp</span>
          <span className="text-xs text-muted-foreground">Send reminder</span>
        </div>
        
        {/* Arrow */}
        <div className="hidden md:block w-12 h-0.5 bg-border" />
        <div className="md:hidden h-8 w-0.5 bg-border" />
        
        {/* Step 4 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 ring-4 ring-background">
            <MessageSquare className="w-7 h-7 text-blue-600" />
          </div>
          <span className="text-sm font-medium">Wait 1hr</span>
          <span className="text-xs text-muted-foreground">Listen for reply</span>
        </div>
        
        {/* Arrow */}
        <div className="hidden md:block w-12 h-0.5 bg-border" />
        <div className="md:hidden h-8 w-0.5 bg-border" />
        
        {/* Step 5 - Branch */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 ring-4 ring-background">
              <Check className="w-7 h-7 text-primary" />
            </div>
            <span className="text-sm font-medium">Confirmed</span>
            <span className="text-xs text-muted-foreground">Done for day</span>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-3 ring-4 ring-background">
              <AlertCircle className="w-7 h-7 text-orange-500" />
            </div>
            <span className="text-sm font-medium">No reply</span>
            <span className="text-xs text-muted-foreground">Send follow-up</span>
          </div>
        </div>
      </div>
    </div>
  );
}
