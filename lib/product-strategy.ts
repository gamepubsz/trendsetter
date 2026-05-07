import type { ProductStrategy } from "./types";

export const productStrategy: ProductStrategy = {
  primaryContentLanguage: "English",
  primaryTrendSource: "YouTube",
  publishingMode: "auto_schedule_after_approval",
  monetizationPriority: ["ads", "affiliate"],
  approvalRule:
    "Generate and schedule content only after a human approves sources, claims, disclosures, and final metadata.",
};

export const strategySummary = [
  {
    label: "Content language",
    value: productStrategy.primaryContentLanguage,
    detail: "English-first titles, scripts, descriptions, thumbnails, and audience research.",
  },
  {
    label: "Trend source",
    value: productStrategy.primaryTrendSource,
    detail: "Integrate YouTube Data/API and analytics before adding TikTok, Reddit, X, or Google Trends.",
  },
  {
    label: "Publishing",
    value: "Review -> auto schedule",
    detail: "Drafts can move to the publishing queue only after explicit approval.",
  },
  {
    label: "Monetization",
    value: "Ads + affiliate",
    detail: "Optimize topics for AdSense RPM first, then attach relevant affiliate offers.",
  },
];
