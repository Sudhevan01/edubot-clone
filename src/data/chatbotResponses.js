// ───────────────────────────────────────────────
//  EduCrop AI Assistant – Frontend-only Response Engine
// ───────────────────────────────────────────────

// ───────────────────────────────────────────────
//  EduCrop AI Assistant – Frontend-only Response Engine
// ───────────────────────────────────────────────

export const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  text: "Hello! I'm **EduBot** - your EduCrop AI assistant. I can help you with product info, features, and more. What would you like to know today?",
  timestamp: new Date(),
};

export const QUICK_REPLIES = [
  { id: 'qr1', label: 'What is EduCrop?', query: 'What is EduCrop?' },
  { id: 'qr2', label: 'Pricing Plans', query: 'Tell me about pricing plans' },
  { id: 'qr3', label: 'Key Features', query: 'What are the key features?' },
  { id: 'qr4', label: 'Contact Support', query: 'How do I contact support?' },
  { id: 'qr5', label: 'For Students', query: 'Is EduCrop good for students?' },
  { id: 'qr6', label: 'For Institutions', query: 'How does EduCrop help institutions?' },
];

// Knowledge base — each entry has keywords and a rich response
const KB = [
  {
    keywords: ['what is educrop', 'about educrop', 'educrop?', 'tell me about educrop', 'overview', 'introduce'],
    response: `**EduCrop** is a next-generation Learning Management System (LMS) designed for modern educational institutions.

It bridges the gap between traditional education and digital innovation by offering:
- Seamless **course creation & management**
- Real-time **student performance tracking**
- Built-in **collaboration tools**
- Fully **mobile-responsive** interface

Whether you're a small coaching center or a large university, EduCrop scales effortlessly to meet your needs.`,
  },
  {
    keywords: ['feature', 'features', 'what can', 'capabilities', 'functionalities', 'what does it do'],
    response: `EduCrop packs a powerful feature set! Here's a snapshot:

**Analytics Dashboard** — Real-time insights into learner progress
**Video Lectures** — Upload & stream HD course content
**Assessments** — Quizzes, assignments, & auto-grading
**Live Chat** — In-platform messaging between students & teachers
**Smart Notifications** — Automated reminders & alerts
**Multi-language** — Supports multiple regional languages
**Mobile App** — iOS & Android apps available

Want me to dive deeper into any specific feature?`,
  },
  {
    keywords: ['price', 'pricing', 'cost', 'plan', 'plans', 'subscription', 'how much', 'fee', 'charge'],
    response: `EduCrop offers flexible pricing plans for every need:

**Starter** — *Free Forever*
- Up to 50 students
- 5 courses
- Basic analytics

**Growth** — *₹2,499/month*
- Up to 500 students
- Unlimited courses
- Advanced analytics + assessments

**Enterprise** — *Custom Pricing*
- Unlimited students & courses
- Dedicated support manager
- Custom branding & integrations
- SLA-backed uptime guarantee

Visit the Product page for full comparison, or contact us for a custom quote!`,
  },
  {
    keywords: ['student', 'students', 'learner', 'learn', 'study', 'learning'],
    response: `EduCrop is built **for students** at its core!

Students get:
- **Personalized learning paths** based on performance
- **Progress tracking** with milestones & badges
- **Smart study reminders** via notifications
- Access content **anywhere, anytime** on mobile
- Peer-to-peer **discussion forums**
- **Certificates** upon course completion

EduCrop makes learning engaging, not just efficient!`,
  },
  {
    keywords: ['institution', 'institute', 'school', 'college', 'university', 'organization', 'org', 'teacher', 'faculty'],
    response: `EduCrop empowers institutions with enterprise-grade tools:

- **Bulk enrollment** — onboard hundreds of students at once
- **Role management** — Admin, Teacher, Student, Parent roles
- **Custom branding** — your logo, colors, domain
- **Comprehensive reports** — institution-wide analytics
- **API integrations** — connect with existing systems
- **Compliance-ready** — GDPR & data privacy compliant

Join **500+ institutions** already transforming education with EduCrop!`,
  },
  {
    keywords: ['contact', 'support', 'help', 'reach', 'email', 'phone', 'call', 'talk to'],
    response: `We're here to help you!

**Email Support:**
- General: Educropblr@gmail.com
- Technical: info@devcreationsblr.com

**Phone:**
- +91 73378 40612 (Mon–Sat, 9AM–6PM IST)

**Live Chat:**
- Available on our platform for active subscribers

Our average response time is under **2 hours** on business days!`,
  },
  {
    keywords: ['mobile', 'app', 'android', 'ios', 'phone', 'tablet'],
    response: `Yes! EduCrop has a fully-featured **mobile app**

- Available on **Android** (Google Play)
- Available on **iOS** (App Store)
- **Offline mode** — download lessons for offline access
- Push notifications for assignments & announcements
- Stream or download video lectures
- Dark mode support

The app is completely free to download — students just need a login from their institution!`,
  },
  {
    keywords: ['free trial', 'trial', 'demo', 'try', 'test', 'free demo', 'get started'],
    response: `Absolutely! You can start with EduCrop today — **no credit card required**!

**Option 1:** Create a **Free Starter account** instantly at org.educrop.com

**Option 2:** Book a **live demo** call with our onboarding team — takes about 30 minutes, completely free.

**Option 3:** Explore the **Docs** section to learn at your own pace.

Ready to get started? Click **Login** in the top navigation!`,
  },
  {
    keywords: ['security', 'secure', 'data', 'privacy', 'gdpr', 'safe', 'protect'],
    response: `Data security is our **top priority** at EduCrop

- **256-bit SSL encryption** on all data transmissions
- **GDPR compliant** — full data rights for all users
- **Role-based access control** — granular permissions
- **Regular automated backups** (daily + real-time)
- Data hosted on **ISO 27001 certified** cloud infrastructure
- **Privacy-first** — we never sell your data

Read our full Privacy Policy for complete details.`,
  },
  {
    keywords: ['integration', 'integrate', 'api', 'connect', 'third-party', 'zoom', 'google', 'microsoft'],
    response: `EduCrop offers seamless **integrations** with popular tools!

**Video Conferencing:** Zoom, Google Meet, Microsoft Teams
**Productivity:** Google Workspace, Microsoft 365
**Storage:** Google Drive, OneDrive
**Payment Gateways:** Razorpay, Stripe, PayPal
**Developer API:** RESTful API with comprehensive documentation & webhooks

Check the Docs page for full API documentation!`,
  },
  {
    keywords: ['login', 'sign in', 'sign up', 'register', 'account', 'portal'],
    response: `Getting into EduCrop is easy!

**For New Users:**
1. Click the **Login** button in the top right corner
2. You'll be redirected to **org.educrop.com**
3. Click "Get Started Free" to create your account

**For Existing Users:**
- Visit org.educrop.com and enter your credentials
- Or use **Google Sign-In** for one-click access

**Forgot password?** Use the "Forgot Password" link — you'll get a reset email within minutes.

Need help? Email us at Educropblr@gmail.com`,
  },
  {
    keywords: ['certificate', 'certification', 'badge', 'achievement', 'completion'],
    response: `EduCrop has a comprehensive **certification system**!

- **Course completion certificates** — auto-generated, printable PDF
- **Achievement badges** — gamified learning milestones
- **Skill endorsements** — verified by instructors
- **LinkedIn integration** — share certificates directly to your profile
- **Transcript exports** — official records for admissions or employers

All certificates include a **unique verification QR code** to prevent fraud!`,
  },
  {
    keywords: ['language', 'hindi', 'kannada', 'tamil', 'regional', 'multilingual'],
    response: `EduCrop supports **multilingual education**!

Currently supported languages:
- Hindi, Kannada, Tamil, Telugu, Marathi
- English

More languages are being added every quarter. The platform auto-detects preferred language from browser settings!`,
  },
];

// Fallback responses (rotated randomly so it doesn't feel robotic)
const FALLBACKS = [
  `Hmm, I'm not sure about that specific topic yet! But I can help you with:
- EduCrop features & overview
- Pricing & plans
- Student & teacher benefits
- Contact & support

Try one of the quick suggestions below, or visit our Contact page to talk to a human expert!`,

  `That's a great question, but it's a bit outside my current knowledge! For detailed assistance:
1. Visit the Docs page for comprehensive guides
2. Email us at Educropblr@gmail.com
3. Call us at +91 73378 40612

Meanwhile, feel free to ask me about EduCrop's features, pricing, or getting started!`,

  `I don't have information on that yet — but our team definitely does!

Reach out via the Contact page or try asking me about:
- Product features
- Pricing plans
- Getting started with EduCrop`,
];

// ───────────────────────────────────────────────
//  Smart response engine — keyword matching
// ───────────────────────────────────────────────
export function getResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim();

  // Greeting detection
  if (/^(hi|hello|hey|howdy|greetings|hola|sup|yo)\b/.test(msg)) {
    return `Hey there! Great to see you! I'm **EduBot**, EduCrop's AI assistant.

How can I help you today? You can ask me about:
- What EduCrop is
- Pricing & plans
- Platform features
- Contacting support

Or just pick a quick reply below!`;
  }

  // Thanks detection
  if (/\b(thanks?|thank you|thx|ty|cheers|appreciate)\b/.test(msg)) {
    return `You're very welcome! I'm always here if you have more questions. Is there anything else I can help you with about EduCrop?`;
  }

  // Bye detection
  if (/\b(bye|goodbye|see you|cya|later|farewell)\b/.test(msg)) {
    return `Goodbye! It was a pleasure chatting with you. Come back anytime — EduBot is always here! Have a wonderful day!`;
  }

  // Search knowledge base
  for (const entry of KB) {
    for (const keyword of entry.keywords) {
      if (msg.includes(keyword)) {
        return entry.response;
      }
    }
  }

  // Random fallback
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}
