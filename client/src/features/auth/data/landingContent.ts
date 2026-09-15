// ─── Type Definitions ────────────────────────────────────────────────────────

export interface ValueProposition {
  illustration: string;
  title: string;
  body: string;
}

export interface FeatureDetail {
  illustration: string;
  alt: string;
  eyebrow: string;
  headline: string;
  body: string;
}

export type FooterLink = string;

// ─── Asset Imports ──────────────────────────────────────────────────────────

import resourcesIllustration from '@/assets/illustrations/resources.svg';
import mentorshipIllustration from '@/assets/illustrations/mentorship.svg';
import aiAssistantIllustration from '@/assets/illustrations/ai-assistant.svg';
import mentorConnectIllustration from '@/assets/illustrations/mentor-connect.svg';
import communityIllustration from '@/assets/illustrations/community.svg';
import aiKnowledgeIllustration from '@/assets/illustrations/ai-knowledge.svg';

// ─── Content Data ────────────────────────────────────────────────────────────

/**
 * Values displayed in the horizontal strip below the Hero section.
 */
export const valueProps: ValueProposition[] = [
  {
    illustration: resourcesIllustration,
    title: 'Share Resources',
    body: 'Upload notes, slides, and past papers. Everything your peers need, in one searchable library.',
  },
  {
    illustration: mentorshipIllustration,
    title: 'Find Mentors',
    body: 'Connect with seniors and faculty who have been where you are and know exactly how to help.',
  },
  {
    illustration: aiAssistantIllustration,
    title: 'AI That Knows Your Campus',
    body: 'Ask anything. Our AI is trained on your actual course material — not generic internet answers.',
  },
];

/**
 * Detailed feature spotlights with alternating layouts.
 */
export const features: FeatureDetail[] = [
  {
    illustration: mentorConnectIllustration,
    alt: 'Mentor connecting with student',
    eyebrow: 'Mentorship',
    headline: "Learn from those who've been in your seat.",
    body: 'Browse verified mentors from your own university. Book sessions, ask questions, and build relationships that go well beyond graduation.',
  },
  {
    illustration: communityIllustration,
    alt: 'Campus community gathering',
    eyebrow: 'Community',
    headline: 'Your campus has more to offer than lectures.',
    body: 'Post questions, share wins, find study partners, and stay in the loop with everything happening across your campus community.',
  },
  {
    illustration: aiKnowledgeIllustration,
    alt: 'AI knowledge assistant processing data',
    eyebrow: 'AI Assistant',
    headline: 'An AI that actually read your syllabus.',
    body: 'Ask about your course material and get answers grounded in the actual resources your university uses — not generic internet results. Powered by RAG.',
  },
];

/**
 * Navigation links for the footer.
 */
export const footerLinks: FooterLink[] = [
  'About',
  'Resources',
  'Community',
  'AI Assistant',
  'Contributors',
];