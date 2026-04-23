import { PlayCircle } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  videoId: string;
}

const tutorials: TutorialVideo[] = [
  {
    id: "getting-started",
    title: "How to Use TikProfitPro",
    description: "Watch how to find winning products in under 2 minutes.",
    videoId: "lWwx4ZflJyU",
  },
];

export default function Tutorials() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <PlayCircle className="h-7 w-7 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Tutorials</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Learn how to get the most out of TikProfitPro with our video guides.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tutorials.map((tutorial) => (
              <div
                key={tutorial.id}
                className="rounded-xl overflow-hidden border border-border bg-card"
                style={{ boxShadow: "0 0 30px rgba(0,255,136,0.08)" }}
              >
                <div
                  className="relative w-full overflow-hidden"
                  style={{
                    paddingTop: "56.25%",
                    borderBottom: "1px solid rgba(0,255,136,0.2)",
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${tutorial.videoId}?rel=0&modestbranding=1`}
                    title={tutorial.title}
                    className="absolute inset-0 w-full h-full"
                    frameBorder={0}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="p-4 md:p-5 space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">{tutorial.title}</h2>
                  <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground py-4">
            More tutorials coming soon.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
