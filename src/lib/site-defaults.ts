import { DEFAULT_FAQ_CATEGORIES } from "@/lib/faqs";
import { DEFAULT_HERO_PATH } from "@/lib/slides";
import { DEFAULT_PRIMARY_COLOR, SITE_SETTING_ID } from "@/lib/theme";

export { DEFAULT_FAQ_CATEGORIES, DEFAULT_HERO_PATH, DEFAULT_PRIMARY_COLOR, SITE_SETTING_ID };

export const DEFAULT_HERO_SLIDE = {
  id: "cmhomepagehero01",
  sortOrder: 0,
  alt: "Bury Steps Walking Group",
  imagePath: DEFAULT_HERO_PATH,
};

export const DEFAULT_TESTIMONIALS = [
  {
    id: "t_jane",
    sortOrder: 0,
    name: "Jane H.",
    role: "Member, Bury",
    quote:
      "I used to struggle to get out on a Sunday. These walks gave me a reason to leave the house, and I have made friends I would never have met otherwise.",
  },
  {
    id: "t_david",
    sortOrder: 1,
    name: "David P.",
    role: "Walks most Sundays",
    quote:
      "Nobody minds if you are slow or quiet. I come for the fresh air and the company, and I always leave feeling better than when I arrived.",
  },
  {
    id: "t_aisha",
    sortOrder: 2,
    name: "Aisha K.",
    role: "New member",
    quote:
      "I was nervous about joining a group I did not know. People were kind from the first walk. It is the highlight of my week now.",
  },
] as const;

export const DEFAULT_FAQS = [
  {
    id: "faq_join",
    sortOrder: 0,
    categoryId: "faqcat_joining",
    question: "How do I join the group?",
    answer:
      "Create an account with email or Google, then sign in. Upcoming walks appear under Walks. Last-minute photos and chat also live in the Facebook group.",
  },
  {
    id: "faq_fit",
    sortOrder: 1,
    categoryId: "faqcat_joining",
    question: "Do I need to be fit?",
    answer:
      "No. Walks are self-paced. There are no winners or losers. Beginners and people returning after a break are welcome. Come as you are and walk at a pace that suits you.",
  },
  {
    id: "faq_cost",
    sortOrder: 2,
    categoryId: "faqcat_joining",
    question: "Is there a cost?",
    answer:
      "No. Bury Steps is a free community walking group. You only need an account so we know who is on the walk.",
  },
  {
    id: "faq_when",
    sortOrder: 3,
    categoryId: "faqcat_walks",
    question: "When do you walk?",
    answer:
      "We usually meet on Sunday afternoons around Bury and the surrounding countryside. Each walk has its own time and meeting point.",
  },
  {
    id: "faq_next",
    sortOrder: 4,
    categoryId: "faqcat_walks",
    question: "How do I see the next walk?",
    answer:
      "Sign in and open Walks. Your organiser posts upcoming walks there, with a share link you can use to clock in on the day.",
  },
  {
    id: "faq_drop",
    sortOrder: 5,
    categoryId: "faqcat_walks",
    question: "What if I cannot make it?",
    answer:
      "Just stay home. There is no need to message unless you want to. If you have already clocked in, tell an organiser so they know you are not on the walk.",
  },
  {
    id: "faq_bring",
    sortOrder: 6,
    categoryId: "faqcat_on_the_day",
    question: "What should I bring?",
    answer:
      "Comfortable shoes, water, and clothes for the weather. A phone is useful for the clock-in link. There is no kit list and no need to buy anything special.",
  },
  {
    id: "faq_dog",
    sortOrder: 7,
    categoryId: "faqcat_on_the_day",
    question: "Can I bring a dog?",
    answer:
      "Ask the walk organiser for that walk. If dogs are welcome, keep yours under control and be kind to other walkers and wildlife.",
  },
  {
    id: "faq_clock",
    sortOrder: 8,
    categoryId: "faqcat_on_the_day",
    question: "How does clock-in work?",
    answer:
      "Open the walk link on the day, confirm you are fit to take part, and clock in. Clock-in opens an hour before the start. After you join, you can see the names of other people who have clocked in.",
  },
  {
    id: "faq_health",
    sortOrder: 9,
    categoryId: "faqcat_account",
    question: "Who can see my health notes?",
    answer:
      "Only walk organisers. Members who clock in see names only. Health notes are deleted 90 days after the walk.",
  },
] as const;

/** Pinned member-bell welcome — recreated on site reset (same as the migration seed). */
export const DEFAULT_WELCOME_NOTICE = {
  id: "notice_system_welcome",
  title: "Welcome, {{firstName}}",
  body:
    "Welcome to Bury Steps Walking Group.\n\n• Walks — see upcoming Sundays and clock in on the day.\n• Progress — how the group is doing this month together.\n• History — every walk you have clocked in to.\n• The bell — short updates from the organisers (this message stays at the top).\n\nQuestions? Ask in the Facebook group or talk to an organiser on a walk.",
} as const;
