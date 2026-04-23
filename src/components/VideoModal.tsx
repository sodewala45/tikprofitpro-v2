import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId?: string;
  title?: string;
}

export default function VideoModal({
  open,
  onOpenChange,
  videoId = "lWwx4ZflJyU",
  title = "How to Use TikProfitPro",
}: VideoModalProps) {
  const src = open
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-[95vw] p-0 border-0 overflow-hidden"
        style={{
          background: "#080c14",
          boxShadow: "0 0 60px rgba(0,255,136,0.15)",
        }}
      >
        <div className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-white pr-8">
            {title}
          </h2>
          <div
            className="relative w-full overflow-hidden rounded-xl"
            style={{
              paddingTop: "56.25%",
              border: "1px solid rgba(0,255,136,0.25)",
              boxShadow: "0 0 40px rgba(0,255,136,0.15)",
            }}
          >
            {open && (
              <iframe
                src={src}
                title={title}
                className="absolute inset-0 w-full h-full"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
