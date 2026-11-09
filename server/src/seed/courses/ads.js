// Kursus iklan media sosial: rencana kampanye kecil, copy iklan, dan membaca dashboard.
export default {
  slug: 'ads',
  title: 'Social Media Ads for Beginners',
  category: 'marketing',
  type: 'Video',
  level: 'Beginner',
  rating: 4.4,
  author: 'Sari Wulandari',
  description: 'Plan a small budget campaign, write ad copy and read the results dashboard.',
  thumbnailUrl: null,
  lessons: [
    {
      title: 'How social media ads work',
      type: 'Video',
      minutes: 9,
      videoId: 'ol0v779BlAA',
      videoStart: 0,
      contentMd: `- Paid social lets you choose who sees your message and pay for impressions or clicks, instead of hoping an organic post reaches the right people.
- The video compares where different messages work best. Write down which platform fits a student audience in Indonesia, and why.`,
    },
    {
      title: 'Planning a small-budget campaign',
      type: 'Article',
      minutes: 10,
      contentMd: `You do not need a big budget to learn social media ads. With Rp50,000 to Rp100,000 per day you can run a real test, as long as the campaign has a clear goal and a narrow scope.

## Pick one objective

Ad platforms such as Meta Ads Manager and TikTok Ads Manager ask for an objective first, and they optimise delivery for it:

- **Awareness**: show the ad to as many relevant people as possible.
- **Traffic**: get clicks to a website or app.
- **Engagement**: likes, comments, video views or messages.
- **Leads**: collect sign-ups through a form.
- **Sales**: purchases or other conversions on your site.

Choose the one closest to the real business result. If you want sign-ups, choose Leads or Sales, not Engagement: the platform will happily find people who like posts but never register.

## Define the audience

Describe the people you want to reach: location, age range, interests and behaviour. Start fairly broad (for example Jakarta, 18 to 24, interested in programming and online courses) and let the delivery system find the people who respond. Very narrow audiences are expensive and learn slowly.

## Set budget and schedule

Give each ad set enough budget to collect data, and let it run for at least seven days without big changes so the delivery system can finish its learning phase.

\`\`\`text
Daily budget    Rp75,000
Duration        10 days
Total           Rp750,000
Target CPC      under Rp1,500
\`\`\`

## Prepare two or three variations

Make two or three versions of the ad that differ in one thing only (the image, the headline or the first line), so you know what made the difference.

## Planning checklist

1. One campaign, one objective, one success metric.
2. One audience per ad set.
3. A budget you can afford to spend on learning.
4. At least seven days before judging results.
5. A landing page that keeps the ad's promise.

> **Tip:** set up the platform's pixel or conversion tracking before you launch. Without it you can see clicks, but not who actually signed up.`,
    },
    {
      title: 'Choosing your audience',
      type: 'Video',
      minutes: 12,
      videoId: '1DLL2ww21dM',
      videoStart: 0,
      contentMd: `- An experienced media buyer explains how he sets up targeting for Meta (Facebook and Instagram) ads today.
- As you watch, write down the location, age range and interests you would start with for your own campaign. You will need them in the practice.`,
    },
    {
      title: 'Writing ad copy that gets clicks',
      type: 'Video',
      minutes: 15,
      videoId: 'LP3wCH9R8JY',
      videoStart: 0,
      contentMd: `- Alex walks through five things good Facebook ads do to stand out, with real examples.
- Lead with the reader's problem, keep one clear call to action, and make sure the landing page delivers what the ad promises.`,
    },
    {
      title: 'Reading the results dashboard',
      type: 'Article',
      minutes: 10,
      contentMd: `After a few days, Ads Manager fills up with numbers. Knowing which ones matter, and how they connect, is the difference between optimising and guessing.

## The funnel in numbers

Read the metrics from top to bottom, like a funnel:

1. **Reach**: unique people who saw the ad at least once.
2. **Impressions**: total times the ad was shown. One person can see it several times.
3. **Frequency**: impressions ÷ reach. Above about 3 or 4 in a week, people start to ignore the ad or get annoyed by it.
4. **Clicks and CTR**: CTR = clicks ÷ impressions × 100. It tells you whether the creative grabs attention.
5. **Conversions**: the action you care about, such as sign-ups or purchases.

## Cost metrics

- **CPM**: cost per 1,000 impressions. It shows how expensive the audience is.
- **CPC**: cost per click, or spend ÷ clicks.
- **CPA** (cost per result): spend ÷ conversions. Usually the most important number.
- **ROAS**: revenue ÷ ad spend. A ROAS of 3 means Rp3 back for every Rp1 spent.

## A worked example

\`\`\`text
Spend        Rp700,000
Impressions  140,000      CPM  Rp5,000
Clicks       1,400        CTR  1.0%     CPC  Rp500
Sign-ups     35           CPA  Rp20,000
\`\`\`

If one sign-up is worth more than Rp20,000 to the business, this campaign is working and is worth scaling slowly.

## What to change

- **Low CTR, normal CPM**: the creative is the problem. Test a new image or opening line.
- **Good CTR, few conversions**: the landing page or the offer is the problem, not the ad.
- **High CPM**: the audience is small or very competitive. Broaden it.
- **Rising frequency and falling CTR**: ad fatigue. Refresh the creative.

Change one thing at a time and give each change a few days, otherwise you will not know which change caused the result.

> **Tip:** judge ads by cost per result, not by likes. A post with many likes and no sign-ups is entertainment, not marketing.`,
    },
    {
      title: 'Quiz: Ad basics',
      type: 'Quiz',
      questions: [
        {
          text: 'How is CTR calculated?',
          options: ['Clicks ÷ impressions × 100', 'Spend ÷ clicks', 'Impressions ÷ reach', 'Revenue ÷ spend'],
          correctIndex: 0,
          explanation: 'Click-through rate is the share of impressions that turned into clicks. Spend ÷ clicks is CPC and impressions ÷ reach is frequency.',
          mono: false,
        },
        {
          text: 'What does CPM measure?',
          options: ['Clicks per minute', 'Cost per 1,000 impressions', 'Conversions per month', 'Cost per message'],
          correctIndex: 1,
          explanation: 'CPM (cost per mille) is what you pay for 1,000 impressions. A high CPM means the audience is expensive to reach.',
          mono: false,
        },
        {
          text: 'You spend Rp500,000 and get 250 clicks. What is the CPC?',
          options: ['Rp200', 'Rp250', 'Rp2,000', 'Rp20,000'],
          correctIndex: 2,
          explanation: 'CPC = spend ÷ clicks = Rp500,000 ÷ 250 = Rp2,000.',
          mono: false,
        },
        {
          text: 'Your ad shows a frequency of 6 for the week. What does that mean?',
          options: ['6 people saw the ad', 'The ad got 6 clicks', 'The CTR was 6%', 'Each person saw the ad about 6 times on average'],
          correctIndex: 3,
          explanation: 'Frequency = impressions ÷ reach. At 6 per week, many people are probably tired of the ad, so refresh the creative.',
          mono: false,
        },
        {
          text: 'What is a sensible first test with a small budget?',
          options: ['Run 20 ad sets for a single day', 'Run one ad set with 2–3 ad variations for at least a week', 'Change the targeting every few hours', 'Spend the whole budget on the first day'],
          correctIndex: 1,
          explanation: 'Few variations and enough time give the delivery system data to learn from and give you a fair comparison.',
          mono: false,
        },
      ],
    },
    {
      title: 'Practice: Plan a campaign',
      type: 'Practice',
      minutes: 30,
      contentMd: 'Plan a test campaign for the SkillLearn student plan with a total budget of Rp1,000,000. Fill in every field so a teammate could set it up in Ads Manager without asking you anything.',
      practice: {
        fileName: 'campaign.md',
        language: 'markdown',
        starterCode: `# Campaign plan

Product: SkillLearn student plan (Rp49,000/month)
Total budget: Rp1,000,000

## Goal
- Objective: 
- Success metric: 

## Audience
- Location: 
- Age: 
- Interests: 

## Budget
- Daily budget: 
- Duration (days): 

## Ad copy
- Headline (max 40 characters): 
- Primary text: 
- Call to action: 
`,
        tasks: [
          'Choose one objective and the metric you will judge it by',
          'Describe the audience: location, age range and at least two interests',
          'Split the budget into a daily amount over at least 7 days',
          'Write a headline (max 40 characters), primary text and a call to action',
        ],
        hint: 'Rp1,000,000 over 10 days is Rp100,000 per day. For sign-ups choose Leads or Sales, and judge the test by cost per sign-up, not by likes.',
        checks: [
          { label: 'Objective is a platform goal', pattern: 'Objective:[ \\t]*(awareness|traffic|engagement|leads|app promotion|sales)', flags: 'i' },
          { label: 'Age range is set (e.g. 18-24)', pattern: 'Age:[ \\t]*\\d{2}\\s*[-–]\\s*\\d{2}', flags: '' },
          { label: 'Daily budget is a number', pattern: 'Daily budget:[ \\t]*(Rp\\s?)?\\d', flags: 'i' },
          { label: 'Runs for at least 7 days', pattern: 'Duration \\(days\\):[ \\t]*([7-9]|[1-9]\\d+)\\b', flags: '' },
          { label: 'Headline is 5–40 characters', pattern: 'Headline \\(max 40 characters\\):[ \\t]*\\S[^\\n]{4,39}$', flags: 'm' },
        ],
      },
    },
  ],
};
