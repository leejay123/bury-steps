-- CreateTable
CREATE TABLE "HomepageFaq" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageFaq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomepageFaq_sortOrder_idx" ON "HomepageFaq"("sortOrder");

-- Starter questions for the public homepage. Organisers can edit or remove these.
INSERT INTO "HomepageFaq" ("id", "sortOrder", "category", "question", "answer", "createdAt", "updatedAt") VALUES
('faq_join', 0, 'joining', 'How do I join the group?', 'Create an account with email or Google, then sign in. Upcoming walks appear under Walks. Last-minute photos and chat also live in the Facebook group.', NOW(), NOW()),
('faq_fit', 1, 'joining', 'Do I need to be fit?', 'No. Walks are self-paced. There are no winners or losers. Beginners and people returning after a break are welcome. Come as you are and walk at a pace that suits you.', NOW(), NOW()),
('faq_cost', 2, 'joining', 'Is there a cost?', 'No. Bury Steps is a free community walking group. You only need an account so we know who is on the walk.', NOW(), NOW()),
('faq_when', 3, 'walks', 'When do you walk?', 'We usually meet on Sunday afternoons around Bury and the surrounding countryside. Each walk has its own time and meeting point.', NOW(), NOW()),
('faq_next', 4, 'walks', 'How do I see the next walk?', 'Sign in and open Walks. Your organiser posts upcoming walks there, with a share link you can use to clock in on the day.', NOW(), NOW()),
('faq_drop', 5, 'walks', 'What if I cannot make it?', 'Just stay home. There is no need to message unless you want to. If you have already clocked in, tell an organiser so they know you are not on the walk.', NOW(), NOW()),
('faq_bring', 6, 'on-the-day', 'What should I bring?', 'Comfortable shoes, water, and clothes for the weather. A phone is useful for the clock-in link. There is no kit list and no need to buy anything special.', NOW(), NOW()),
('faq_dog', 7, 'on-the-day', 'Can I bring a dog?', 'Ask the walk organiser for that walk. If dogs are welcome, keep yours under control and be kind to other walkers and wildlife.', NOW(), NOW()),
('faq_clock', 8, 'on-the-day', 'How does clock-in work?', 'Open the walk link on the day, confirm you are fit to take part, and clock in. Clock-in opens an hour before the start. After you join, you can see the names of other people who have clocked in.', NOW(), NOW()),
('faq_health', 9, 'account', 'Who can see my health notes?', 'Only walk organisers. Members who clock in see names only. Health notes are deleted 90 days after the walk.', NOW(), NOW());
