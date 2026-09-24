/**
 * Community posts, DMs, mentorships and contributor applications for the
 * demo. `daysAgo`/`hoursAgo` are used to backdate documents after they are
 * created through the real services.
 */

export interface SeedComment {
  author: string;
  content: string;
  hoursAfterPost: number;
}

export interface SeedPost {
  author: string;
  title: string;
  content: string;
  daysAgo: number;
  upvoters: string[];
  comments: SeedComment[];
}

export const POSTS: SeedPost[] = [
  {
    author: 'sara',
    title: 'Study group for CS-341 midterm — Thursday, CS library',
    content:
      'A few of us are revising Networks together this Thursday at 3pm on the first floor of the CS library. Plan: OSI vs TCP/IP, TCP congestion control, then subnetting practice. Everyone welcome, bring your own questions.',
    daysAgo: 2,
    upvoters: ['ali', 'amna', 'hassan', 'daniyal', 'hamza', 'zainab'],
    comments: [
      {
        author: 'ali',
        content:
          "I'm in. Can we spend some time on slow start vs congestion avoidance? I keep mixing them up.",
        hoursAfterPost: 1,
      },
      {
        author: 'hamza',
        content:
          "I'll drop by for the subnetting part. My practice sheet is in review on Resources and should be up soon.",
        hoursAfterPost: 3,
      },
      { author: 'amna', content: 'Count me in!', hoursAfterPost: 5 },
    ],
  },
  {
    author: 'omer',
    title: 'How do you actually get better at DP?',
    content:
      "I understand the knapsack solution when I read it but I freeze on new DP problems in the lab. Any structured way to practise? I've done about 10 problems so far.",
    daysAgo: 4,
    upvoters: ['iqra', 'fahad', 'waqas', 'ali', 'khadija'],
    comments: [
      {
        author: 'ayesha',
        content:
          'Always write down in words what dp[i] (or dp[i][j]) means before you write any code. Then do problems by pattern: 1D, grid paths, knapsack, LCS/edit distance, interval DP. I put my notes on Resources under CS-202.',
        hoursAfterPost: 2,
      },
      {
        author: 'talha',
        content:
          '+1 to the pattern approach. After 30–40 problems the states start to look familiar.',
        hoursAfterPost: 6,
      },
      {
        author: 'omer',
        content: 'Thanks both, starting with the notes tonight.',
        hoursAfterPost: 8,
      },
    ],
  },
  {
    author: 'zainab',
    title: 'My first PR got merged into an open-source project 🎉',
    content:
      "After three weeks of back and forth my fix for a date-parsing bug got merged. If you're thinking about open source, start with docs or 'good first issue' labels — maintainers were super patient.",
    daysAgo: 6,
    upvoters: [
      'usman',
      'mahnoor',
      'amna',
      'saad',
      'ali',
      'sara',
      'bilal',
      'waqas',
    ],
    comments: [
      {
        author: 'usman',
        content: 'Huge! Put this on your CV right away.',
        hoursAfterPost: 1,
      },
      {
        author: 'mahnoor',
        content: 'Which project? Would love to try too.',
        hoursAfterPost: 4,
      },
      {
        author: 'zainab',
        content:
          "A JavaScript date library. I'll share the issue list I used in a separate post.",
        hoursAfterPost: 5,
      },
    ],
  },
  {
    author: 'hassan',
    title: 'Setting up WSL for the OS lab — what worked for me',
    content:
      'For anyone on Windows: install WSL2 with Ubuntu, then `sudo apt install build-essential gdb`. Keep your lab files inside the Linux filesystem (~/), not /mnt/c, or compiling gets really slow. VS Code with the WSL extension works well.',
    daysAgo: 9,
    upvoters: ['daniyal', 'ali', 'omer', 'fahad', 'hamza'],
    comments: [
      {
        author: 'hamza',
        content:
          'Good advice on /mnt/c. Also enable systemd if you need services for the networking lab.',
        hoursAfterPost: 3,
      },
      {
        author: 'fahad',
        content: 'This saved me an hour, thanks.',
        hoursAfterPost: 20,
      },
    ],
  },
  {
    author: 'talha',
    title: 'Is the ML elective worth it in 7th semester?',
    content:
      "Deciding between Machine Learning and Cloud Computing as my elective. I like the idea of ML but I'm worried about the maths load alongside FYP. Anyone who took it?",
    daysAgo: 12,
    upvoters: ['iqra', 'sara', 'noor'],
    comments: [
      {
        author: 'fatima',
        content:
          'Took it last year — worth it. Linear algebra and probability basics are enough to start; the assignments are the real learning. Happy to mentor if you pick it.',
        hoursAfterPost: 2,
      },
      {
        author: 'hira',
        content:
          'If the maths is the worry, eigenvalues and Bayes cover most of what you need early on. I have notes up for both.',
        hoursAfterPost: 5,
      },
    ],
  },
  {
    author: 'noor',
    title: 'Resource request: solved linear algebra problems',
    content:
      'Does anyone have worked problems on diagonalization? The textbook skips steps and I get lost in finding the eigenvectors.',
    daysAgo: 15,
    upvoters: ['rabia', 'khadija'],
    comments: [
      {
        author: 'hira',
        content:
          'Just uploaded worked examples on eigenvalues and diagonalization under MATH-201. Tell me if any step is unclear.',
        hoursAfterPost: 10,
      },
      {
        author: 'noor',
        content: 'Perfect, exactly what I needed!',
        hoursAfterPost: 14,
      },
    ],
  },
  {
    author: 'saad',
    title: 'Internship season — which companies visited last year?',
    content:
      'Career fair is coming up. Seniors, which companies came last year and what did their interviews focus on? Trying to prepare early.',
    daysAgo: 18,
    upvoters: ['maryam', 'mahnoor', 'amna', 'hassan'],
    comments: [
      {
        author: 'bilal',
        content:
          'Mostly software houses and two fintechs. Interviews were DSA plus one system design question for backend roles. SQL came up in every backend interview I had.',
        hoursAfterPost: 4,
      },
      {
        author: 'sana',
        content:
          'Security roles asked a lot of networking basics — know your OSI layers and TCP handshake cold.',
        hoursAfterPost: 9,
      },
    ],
  },
  {
    author: 'maryam',
    title: 'Figma resources for the SE project UI?',
    content:
      "We have to submit wireframes for our Software Engineering project. Any good free Figma kits or tutorials you'd recommend?",
    daysAgo: 21,
    upvoters: ['mahnoor', 'usman'],
    comments: [
      {
        author: 'usman',
        content:
          'Start with low-fi wireframes and only add colour once the flows make sense. The official Figma YouTube channel is honestly enough to get going.',
        hoursAfterPost: 6,
      },
    ],
  },
];

export interface SeedMessage {
  from: string;
  content: string;
  /** Minutes before "now" the message was sent. */
  minutesAgo: number;
}

export interface SeedConversation {
  between: [string, string];
  messages: SeedMessage[];
  /** Leave the last N messages unseen by the recipient (unread badge). */
  unseenTail?: number;
}

/** Plain DMs. Mentorship DMs are opened by MentorshipService.accept(). */
export const CONVERSATIONS: SeedConversation[] = [
  {
    between: ['ali', 'sara'],
    messages: [
      {
        from: 'sara',
        content: 'Are you coming to the Networks study group on Thursday?',
        minutesAgo: 2600,
      },
      {
        from: 'ali',
        content: "Yes! I'll bring the congestion control questions.",
        minutesAgo: 2590,
      },
      {
        from: 'sara',
        content: 'Great. Can you also share your OS scheduling notes after?',
        minutesAgo: 95,
      },
      {
        from: 'sara',
        content: 'The round robin example especially 🙏',
        minutesAgo: 94,
      },
    ],
    unseenTail: 2,
  },
  {
    between: ['ali', 'usman'],
    messages: [
      {
        from: 'ali',
        content:
          'Hey Usman, saw your post on freelancing. How did you get your first client?',
        minutesAgo: 8000,
      },
      {
        from: 'usman',
        content:
          'Built two small projects for friends, then put them on a simple portfolio. First paid gig came through a referral.',
        minutesAgo: 7900,
      },
      {
        from: 'ali',
        content: "Makes sense. I'll start with a portfolio then.",
        minutesAgo: 7890,
      },
    ],
  },
  {
    between: ['zainab', 'mahnoor'],
    messages: [
      {
        from: 'mahnoor',
        content: 'Can you send me that good-first-issue list?',
        minutesAgo: 5000,
      },
      {
        from: 'zainab',
        content: 'Sure, posting it tonight!',
        minutesAgo: 4980,
      },
    ],
  },
];

export interface SeedMentorship {
  mentee: string;
  mentor: string;
  topic: string;
  intro: string;
  outcome: 'pending' | 'active' | 'completed' | 'declined';
  declineReason?: string;
  daysAgo: number;
  /** Follow-up messages in the DM once accepted. */
  followUps?: SeedMessage[];
  unseenTail?: number;
}

export const MENTORSHIPS: SeedMentorship[] = [
  // Ali (demo persona) — one of each state.
  {
    mentee: 'ali',
    mentor: 'ayesha',
    topic: 'Dynamic programming for CS-202',
    intro:
      "Hi Ayesha, I'm in 5th semester and struggling with DP questions in the CS-202 labs. Could you help me build a practice plan before the final?",
    outcome: 'active',
    daysAgo: 8,
    followUps: [
      {
        from: 'ayesha',
        content:
          'Happy to help! Start with my DP notes, then try 3 knapsack-style problems and send me your state definitions.',
        minutesAgo: 10000,
      },
      {
        from: 'ali',
        content:
          'Done with the notes. Here is my dp[i][c] for the coin change one — does it make sense?',
        minutesAgo: 3000,
      },
      {
        from: 'ayesha',
        content:
          'Yes, that state works. Now try iterating c downward so you only need one array.',
        minutesAgo: 180,
      },
    ],
    unseenTail: 1,
  },
  {
    mentee: 'ali',
    mentor: 'hira',
    topic: 'Probability refresher before ML',
    intro:
      "Hi Hira, I'm planning to take the ML elective and want to brush up on probability and Bayes first. Could you point me in the right direction?",
    outcome: 'completed',
    daysAgo: 30,
    followUps: [
      {
        from: 'hira',
        content:
          'Of course. Work through my Bayes notes and the medical-test example, then we can do a few problems together.',
        minutesAgo: 40000,
      },
      {
        from: 'ali',
        content:
          "That base-rate example finally made it click. Thank you, I think I'm ready!",
        minutesAgo: 30000,
      },
    ],
  },
  {
    mentee: 'ali',
    mentor: 'bilal',
    topic: 'Backend design for my semester project',
    intro:
      "Hi Bilal, I'm building a library management system for my DB project and I'm not sure my schema is normalized properly. Would you review it with me?",
    outcome: 'pending',
    daysAgo: 1,
  },
  // Requests Ayesha has to answer (mentor-side demo).
  {
    mentee: 'omer',
    mentor: 'ayesha',
    topic: 'Getting better at DP problems',
    intro:
      'Hi Ayesha, I read your reply on my DP post. Could you mentor me for a few weeks while I practise the patterns you mentioned?',
    outcome: 'pending',
    daysAgo: 2,
  },
  {
    mentee: 'iqra',
    mentor: 'ayesha',
    topic: 'Competitive programming start',
    intro:
      "Hi! I'm in 3rd semester and want to start competitive programming. Where should I begin, and could you check my progress every couple of weeks?",
    outcome: 'pending',
    daysAgo: 3,
  },
  // Other activity so mentors' profiles and counts look alive.
  {
    mentee: 'talha',
    mentor: 'fatima',
    topic: 'ML elective and FYP idea',
    intro:
      "Hi Fatima, I'm deciding on the ML elective and thinking about an ML-based FYP. Could you help me scope an idea that's realistic for one year?",
    outcome: 'active',
    daysAgo: 10,
  },
  {
    mentee: 'maryam',
    mentor: 'usman',
    topic: 'Building a React portfolio',
    intro:
      'Hi Usman, I want to build my first portfolio site in React for internship applications. Could you guide me on structure and what to include?',
    outcome: 'completed',
    daysAgo: 40,
  },
  {
    mentee: 'daniyal',
    mentor: 'hamza',
    topic: 'Linux and networking lab prep',
    intro:
      "Hi Hamza, I'm new to Linux and the networking lab is going over my head. Could we go through the basics together?",
    outcome: 'active',
    daysAgo: 12,
  },
  {
    mentee: 'waqas',
    mentor: 'bilal',
    topic: 'Learning SQL',
    intro:
      "Hi Bilal, I'm in 3rd semester and want to get ahead on SQL before the Databases course. Could you mentor me?",
    outcome: 'declined',
    declineReason:
      "I'm tied up with my internship until midterms end — Hira and Hamza both have free slots if you want to start sooner.",
    daysAgo: 14,
  },
];

export interface SeedApplication {
  applicant: string;
  reason: string;
  sampleUrl?: string;
  outcome: 'pending' | 'approved' | 'rejected';
  daysAgo: number;
}

export const APPLICATIONS: SeedApplication[] = [
  {
    applicant: 'usman',
    reason:
      'I have been freelancing as a React developer for two years and want to share my Software Engineering notes and lab handouts with juniors.',
    sampleUrl: 'https://github.com/',
    outcome: 'approved',
    daysAgo: 60,
  },
  {
    applicant: 'zainab',
    reason:
      'I contribute to open source and have well-organized notes for Web Engineering and Data Structures that I would like to share with my batch.',
    sampleUrl: 'https://github.com/',
    outcome: 'pending',
    daysAgo: 2,
  },
];
