import SectionWrapper from "@/components/landing/SectionWrapper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is TikProfitPro?",
    a: "TikProfitPro is a TikTok Shop intelligence tool that tracks 1,000+ trending products weekly, scores their virality before they peak, matches them with Alibaba suppliers, and calculates your exact profit margin after TikTok fees.",
  },
  {
    q: "How do I find Alibaba suppliers for TikTok Shop products?",
    a: "TikProfitPro automatically searches Alibaba for every trending TikTok Shop product, calculates profit margin after TikTok's 8% commission and payment fees, and saves the top 3 most profitable suppliers for you.",
  },
  {
    q: "How is TikTok Shop profit margin calculated?",
    a: "TikTok Shop profit margin = Selling Price minus Supplier Cost minus TikTok's 8% commission minus 2.9% payment processing fee. TikProfitPro calculates this automatically for every product.",
  },
  {
    q: "How much does TikProfitPro cost?",
    a: "TikProfitPro starts at $39/month with a free plan available. The paid plan includes full access to 1,000+ trending products, virality scores, supplier matching, and profit calculator.",
  },
];

export default function FAQSection() {
  return (
    <SectionWrapper className="pb-16 md:pb-24">
      <h2 className="text-2xl md:text-4xl font-extrabold text-center tracking-tight mb-3">
        Frequently Asked Questions
      </h2>
      <p className="text-center mb-8 md:mb-10 text-sm md:text-base" style={{ color: "#888" }}>
        Everything you need to know about TikProfitPro
      </p>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-white/5 bg-[#111] rounded-2xl px-5 md:px-6 hover:border-[#00ff85]/20 transition-all"
            >
              <AccordionTrigger className="text-sm md:text-base font-semibold text-left hover:no-underline [&>svg]:text-[#00ff85]">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed" style={{ color: "#aaa" }}>
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SectionWrapper>
  );
}
