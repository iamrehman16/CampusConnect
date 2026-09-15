import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";

export const FAQ_SECTIONS = [
  {
    section: "About the Platform",
    items: [
      {
        q: "What is CampusConnect?",
        a: "CampusConnect is an academic collaboration platform built for university students and contributors. It brings together resource sharing, community discussions, AI-powered study assistance, and real-time chat — all in one place. Think of it as your campus, but online and always open.",
      },
      {
        q: "Who is CampusConnect for?",
        a: "CampusConnect is designed for students who want access to quality study materials, contributors who want to share their knowledge with peers, and anyone who believes learning is better together. If you're a QAU student, you're already in the right place.",
      },
      {
        q: "Is CampusConnect free to use?",
        a: "Yes, completely. CampusConnect is a student-built platform for students — no subscriptions, no paywalls, no annoying pop-ups asking you to upgrade. Just log in and use it.",
      },
      {
        q: "What makes CampusConnect different from just a WhatsApp group?",
        a: "We're glad you asked. Unlike a WhatsApp group, CampusConnect has structured resource management with search and filters, an AI assistant trained on campus materials, moderated content so quality stays high, persistent chat, and a profile that tracks your contributions. Your WhatsApp group does not have any of that.",
      },
    ],
  },
  {
    section: "Accounts & Roles",
    items: [
      {
        q: "What are the different user roles?",
        a: "There are three roles on CampusConnect. Students can browse, download resources, participate in discussions, and use the AI assistant. Contributors can do everything students can, plus upload resources and mentor peers. Admins manage the platform, moderate content, and keep things running smoothly.",
      },
      {
        q: "How do I become a Contributor?",
        a: "Contributor access is granted by the platform admin. If you have quality study materials to share — notes, slides, past papers, assignments — reach out to the admin and we'll get you set up. Contributors are the backbone of this platform.",
      },
      {
        q: "Can I change my profile information after signing up?",
        a: "Yes. Head to your Profile page and open the Settings tab. You can update your name, department, semester, interests, and whether you're open to mentoring. Your email cannot be changed once set.",
      },
    ],
  },
  {
    section: "Resources",
    items: [
      {
        q: "What kinds of resources can I find here?",
        a: "CampusConnect hosts Notes, Slides, Assignments, Lab reports, Past Papers, Books, Research Papers, and more. Each resource is tagged with subject, course, and semester so you can filter exactly what you need.",
      },
      {
        q: "How do I upload a resource?",
        a: "If you're a Contributor or Admin, click the Upload Resource button on the Resources page. Fill in the details — title, subject, course, semester, resource type — and attach your file. Your upload goes into a pending review queue and will be approved by an admin before it's publicly visible.",
      },
      {
        q: "Why is my uploaded resource not showing up yet?",
        a: "All resources go through a moderation review before being published. This usually takes a short while. You can track the status of your uploads — Pending, Approved, or Rejected — from the My Uploads tab on the Resources page.",
      },
      {
        q: "Can I search for resources?",
        a: "Yes. The Resources page has a full-text search bar plus filters for resource type and semester. The search runs across titles, descriptions, subjects, courses, and tags — so you don't need to know the exact name of what you're looking for.",
      },
    ],
  },
  {
    section: "AI Assistant",
    items: [
      {
        q: "What can the AI assistant help me with?",
        a: "The Campus AI is built on top of the resources shared on this platform. You can ask it questions about your coursework, request explanations of topics, or ask it to find relevant study materials. It understands context across your conversation, so follow-up questions work naturally.",
      },
      {
        q: "Does the AI remember our previous conversations?",
        a: "Within a single session, the AI maintains full conversational context so you can ask follow-ups without repeating yourself. Sessions do not persist between logins — each new session starts fresh. You can also clear a session anytime using the Clear button in the chat header.",
      },
      {
        q: "Is the AI always accurate?",
        a: "The AI does its best — and it's pretty good — but it can make mistakes, especially on highly specific or niche topics. Always cross-reference important answers with your course materials or instructors. Treat it like a very well-read study partner, not an infallible oracle.",
      },
    ],
  },
  {
    section: "Community & Chat",
    items: [
      {
        q: "What is the Community feed?",
        a: "The Community feed is where students post questions, share updates, start discussions, and upvote useful content. It's the social layer of CampusConnect — less formal than resources, more structured than a group chat.",
      },
      {
        q: "How does the Chat feature work?",
        a: "Chat lets you have real-time private conversations with other users on the platform. It's built for quick back-and-forth — sharing files, asking quick questions, or following up on a community post. Messages are delivered instantly.",
      },
      {
        q: "Can I report inappropriate content?",
        a: "Content moderation is handled by platform admins. If you come across something that seems inappropriate or violates academic integrity, contact the admin directly. We take the quality and safety of this platform seriously.",
      },
    ],
  },
];

export const CREATOR = {
  name: "Abdur Rahman",
  role: "Final Year CS Student · Quaid-i-Azam University",
  initials: "AR",
  links: [
    { icon: <EmailOutlinedIcon fontSize="small" />, label: "Email", href: "mailto:rahmanhere642@gmail.com" },
    { icon: <LinkedInIcon fontSize="small" />, label: "LinkedIn", href: "https://www.linkedin.com/in/abdur-rahman-aab322297/" },
    { icon: <GitHubIcon fontSize="small" />, label: "GitHub", href: "https://github.com/iamrehman16" },
  ],
};