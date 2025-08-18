'use client';

export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Qwen Image",
    "alternateName": "Qwen Image AI Generator",
    "description": "Qwen Image is the leading AI image generator platform. Create stunning art with Qwen Image AI technology. Transform text to images instantly with Qwen Image.",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Try Qwen Image free - no registration required"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "10000",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Qwen Image AI-powered generation",
      "100+ Qwen Image artistic styles",
      "HD quality Qwen Image outputs",
      "Lightning fast Qwen Image processing",
      "Qwen Image commercial license",
      "Qwen Image API access"
    ],
    "screenshot": "/images/qwen-image-screenshot.svg",
    "softwareVersion": "2.0",
    "author": {
      "@type": "Organization",
      "name": "Qwen Image AI",
      "url": "https://qwenimage.ai"
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Qwen Image?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Qwen Image is an advanced AI image generator that uses Qwen Image AI technology to create stunning artwork from text descriptions. Qwen Image is the leading platform for AI art generation."
        }
      },
      {
        "@type": "Question",
        "name": "How does Qwen Image work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Qwen Image uses state-of-the-art AI models to understand your text prompts and generate high-quality images. Simply describe what you want, and Qwen Image AI will create it in seconds using Qwen Image technology."
        }
      },
      {
        "@type": "Question",
        "name": "Is Qwen Image free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Qwen Image offers a free tier with 10 total generations. You can try Qwen Image without registration. For unlimited access to Qwen Image AI features, we offer affordable subscription plans."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use Qwen Image for commercial projects?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all images created with Qwen Image paid plans include commercial usage rights. You own the full rights to your Qwen Image creations."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
    </>
  );
}