// Kursus SEO & content marketing: dominan artikel, latihan menulis title & meta description.
export default {
  slug: 'seo',
  title: 'SEO & Content Marketing 101',
  category: 'marketing',
  type: 'Article',
  level: 'Beginner',
  rating: 4.6,
  author: 'Sari Wulandari',
  description: 'Keyword research, writing for search and measuring results with free tools.',
  thumbnailUrl: null,
  lessons: [
    {
      title: 'How search engines work',
      type: 'Video',
      minutes: 6,
      videoId: '0eKVizvYSUQ',
      videoStart: 0,
      contentMd: `- Search engines crawl pages, store them in an index, and then rank the best matches for each query.
- Notice how many signals decide the order of results: the words in the query, relevance, page quality, usability and context such as location.`,
    },
    {
      title: 'Keyword research basics',
      type: 'Article',
      minutes: 8,
      contentMd: `Keyword research means finding the words people actually type into search engines, then choosing the ones your page can realistically rank for. It stops you from writing great content that nobody searches for.

## Start with seed keywords

Write down 5 to 10 short phrases that describe your topic the way a customer would say them, not the way your company does. A tutoring site might start with "math tutor", "learn calculus" and "UTBK practice questions".

## Expand and measure

Put the seeds into free tools such as Google Keyword Planner and Google Trends, and read the *People also ask* and *Related searches* boxes on the results page. For each idea, look at:

1. **Search volume**: roughly how many searches happen per month.
2. **Difficulty**: how strong the pages that already rank are.
3. **Intent**: what the searcher is trying to do.
4. **Business value**: whether that searcher could become your user or customer.

## Understand search intent

Google ranks pages that match what the searcher wants. Intent usually falls into one of four types:

- **Informational**: "how does compound interest work"
- **Navigational**: "binus maya login"
- **Commercial**: "best laptop for programming students"
- **Transactional**: "buy figma professional plan"

Look at the top ten results before you write. If they are all how-to guides, a product page will struggle to rank for that query, however good it is.

## Go long-tail

Short keywords like "react" have huge volume and fierce competition. Longer, specific phrases such as "react to-do app tutorial for beginners" have less volume but clearer intent and much weaker competition. A new website should target long-tail keywords first and build up from there.

## Keep a simple keyword sheet

\`\`\`text
keyword                          volume  difficulty  intent
react tutorial for beginners     2,400   medium      informational
react to-do app tutorial         390     low         informational
best react course for students   210     low         commercial
\`\`\`

The numbers above are examples; your tool will show its own estimates. What matters is comparing ideas side by side and picking one main keyword per page.

> **Tip:** type your keyword into Google and scroll to the bottom. *Related searches* is a free list of long-tail ideas straight from real users.`,
    },
    {
      title: 'Keyword research step by step',
      type: 'Video',
      minutes: 11,
      videoId: 'OMJQPqG2Uas',
      videoStart: 0,
      contentMd: `- Sam groups keywords by where the searcher is in their journey, from first learning about a problem to being ready to buy.
- He uses Ahrefs, a paid tool. You can follow the same steps with Google Keyword Planner, Google Trends and the *People also ask* box.`,
    },
    {
      title: 'Writing content people search for',
      type: 'Article',
      minutes: 9,
      contentMd: `Content marketing means publishing useful material (articles, guides, videos) that attracts the people you want to reach, builds trust, and turns some of them into users or customers. SEO is how much of that content gets found.

## One page, one main keyword

Give every page a single main keyword and a clear job. Two articles chasing the same keyword compete with each other, which is called keyword cannibalisation. Supporting keywords and synonyms belong naturally on the same page.

## Structure for skimmers

Most readers scan before they read. Help them, and search engines, with a clear outline:

\`\`\`markdown
# How to Build a To-Do App in React (Beginner Guide)

Who this is for and what you will build, in two sentences.

## What you need before you start
## Step 1: Create the project
## Step 2: Add state with useState
## Common mistakes
## Next steps
\`\`\`

Answer the main question in the first two or three sentences, then go deeper. A reader who gets value immediately is more likely to stay, share and come back.

## Write for people first

- Use the words your audience uses, including the keyword, but never force it into every sentence.
- Add something the current top results lack: a real example, your own data or a local angle.
- Keep paragraphs short (two to four sentences) and use lists for steps.
- Link to related pages on your site and to trustworthy sources.

Google's quality guidelines talk about experience, expertise, authoritativeness and trust (E-E-A-T). In practice: show who wrote the content, why they know the topic, and keep facts accurate and up to date.

## Plan with a content calendar

1. List the questions your audience asks, from keyword research, comments and support chats.
2. Group them into topics and pick one in-depth pillar guide per topic.
3. Write shorter supporting posts that link back to the pillar.
4. Publish on a schedule you can actually keep, even if it is only twice a month.

> **Tip:** update your best old posts before writing new ones. Refreshing facts, examples and the title often brings traffic back faster than a brand-new article.`,
    },
    {
      title: 'On-page SEO: titles, descriptions and headings',
      type: 'Article',
      minutes: 8,
      contentMd: `On-page SEO covers everything on the page itself that helps search engines understand it and helps people decide to click. The most important pieces live in your HTML.

## The title tag

The \`<title>\` is the blue link in search results. Keep it between about 30 and 60 characters so it is not cut off, put the main keyword near the start, and make it specific rather than clever.

## The meta description

The description is the grey snippet below the title. It does not directly change rankings, but a clear one raises the click-through rate. Aim for 120 to 160 characters, mention the benefit and give a reason to click.

\`\`\`html
<head>
  <title>React Tutorial for Beginners: Build a To-Do App</title>
  <meta name="description" content="Learn React step by step with free videos and quizzes. Build a working to-do app in under an hour, even if you have never coded before.">
  <link rel="canonical" href="https://example.com/courses/react">
</head>
\`\`\`

The canonical link tells search engines which address is the main one when the same page is reachable through several URLs.

## Headings and URLs

Use one \`<h1>\` that matches the topic of the page, then \`<h2>\` and \`<h3>\` for sections in order. Keep URLs short, lowercase and readable: \`/courses/react\` beats \`/page?id=4821\`.

## Images and links

- Give every meaningful image descriptive \`alt\` text.
- Compress images and set their width and height so the page loads quickly.
- Link to related pages with descriptive anchor text such as "React state tutorial", not "click here".

## On-page checklist

1. Title: 30 to 60 characters, keyword near the start.
2. Meta description: 120 to 160 characters with a benefit.
3. One H1 that matches the search intent.
4. Keyword in the first paragraph and in at least one H2.
5. Canonical URL set to the preferred address.
6. A fast, mobile-friendly page.

> **Tip:** search \`site:yourdomain.com\` on Google to see how your titles and descriptions actually appear in the results.`,
    },
    {
      title: 'Measuring results with free tools',
      type: 'Article',
      minutes: 9,
      contentMd: `SEO is slow: new pages often take weeks or months to settle in the rankings. That makes measurement important, because it tells you which changes are working. Two free Google tools cover almost everything a beginner needs.

## Google Search Console

Search Console shows how your site performs **inside Google Search**, before anyone visits. After you verify your domain, open the Performance report:

- **Impressions**: how many times your pages appeared in results.
- **Clicks**: how many times someone clicked through.
- **CTR**: clicks divided by impressions.
- **Average position**: where your page usually ranked.

Filter by page or by query to see which keywords bring traffic to each page. Use the URL Inspection tool to check whether a new page is indexed and to request indexing.

## Google Analytics 4

GA4 shows what happens **after** the visit: how many users came from organic search, which pages they read, how long they stayed engaged, and whether they completed a goal such as signing up. Mark important actions as key events so you can count them.

## Reading the numbers

\`\`\`text
Page: /blog/react-todo-tutorial   (last 28 days)
Impressions  12,400   Clicks  310   CTR  2.5%   Avg. position  8.7
\`\`\`

A page with many impressions but a low CTR is a quick win: improve the title and description. A page around positions 8 to 15 is close to the first results; improve the content and add internal links to push it up.

## A simple monthly routine

1. Export the top 20 pages and queries from Search Console.
2. Find pages with many impressions and a CTR below 2%, and rewrite their titles.
3. Find pages ranked between 8 and 20, and improve or expand them.
4. Check GA4 to see which organic pages lead to sign-ups.
5. Write down what you changed and when, so you can compare next month.

> **Tip:** compare the last 28 days with the 28 days before, not single days. Daily numbers jump around and hide the real trend.`,
    },
    {
      title: 'Quiz: SEO basics',
      type: 'Quiz',
      questions: [
        {
          text: 'What is a long-tail keyword?',
          options: ['Any keyword with very high search volume', 'A longer, specific phrase with lower volume and clearer intent', 'A keyword that appears only in the URL', 'A keyword you pay for in ads'],
          correctIndex: 1,
          explanation: 'Long-tail phrases are searched less often, but they are easier to rank for and the searcher knows exactly what they want.',
          mono: false,
        },
        {
          text: 'Which free tool shows the search queries your pages appear for in Google?',
          options: ['Google Search Console', 'Google Docs', 'Figma', 'Canva'],
          correctIndex: 0,
          explanation: 'Search Console reports impressions, clicks, CTR and average position for each query and page.',
          mono: false,
        },
        {
          text: 'What is the main intent behind "best budget laptop for students"?',
          options: ['Navigational', 'Informational', 'Commercial', 'Transactional'],
          correctIndex: 2,
          explanation: 'The searcher is comparing options before buying, which is commercial intent. Reviews and comparisons rank well here.',
          mono: false,
        },
        {
          text: 'Which of these is keyword stuffing?',
          options: ['Using the keyword in the title and first paragraph', 'Adding descriptive alt text to images', 'Linking to related articles', 'Repeating the exact keyword in almost every sentence'],
          correctIndex: 3,
          explanation: 'Forcing the same phrase everywhere hurts readability and can be treated as spam. Use the keyword naturally.',
          mono: false,
        },
        {
          text: 'A page has 10,000 impressions and 100 clicks. What is its CTR?',
          options: ['0.1%', '1%', '10%', '100%'],
          correctIndex: 1,
          explanation: 'CTR = clicks ÷ impressions = 100 ÷ 10,000 = 1%.',
          mono: false,
        },
      ],
    },
    {
      title: 'Practice: Write a title and meta description',
      type: 'Practice',
      minutes: 20,
      contentMd: 'You are optimising the landing page of a free beginner React course. The target keyword is **react tutorial for beginners**. Edit the `<head>` and the `<h1>` so the page is ready for search.',
      practice: {
        fileName: 'meta.html',
        language: 'html',
        starterCode: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <!-- Target keyword: react tutorial for beginners -->
  <title>Home</title>
  <meta name="description" content="">
  <link rel="canonical" href="">
</head>
<body>
  <h1>Welcome</h1>
  <p>Free video lessons, quizzes and a to-do app project.</p>
</body>
</html>
`,
        tasks: [
          'Write a 30–60 character title that starts with the target keyword',
          'Write a 120–160 character meta description with a clear benefit',
          'Set the canonical URL to https://example.com/courses/react',
          'Rewrite the H1 so it matches what the searcher wants',
        ],
        hint: 'Put the keyword first in the title, then add what the reader gets. Count characters with a free SERP preview tool or your editor\'s status bar.',
        checks: [
          { label: 'Title is 30–60 characters', pattern: '<title>[^<]{30,60}</title>', flags: '' },
          { label: 'Title starts with the target keyword', pattern: '<title>\\s*react tutorial for beginners', flags: 'i' },
          { label: 'Description is 120–160 characters', pattern: '<meta\\s+name="description"\\s+content="[^"]{120,160}"', flags: 'i' },
          { label: 'Canonical URL is filled in', pattern: '<link\\s+rel="canonical"\\s+href="https://[^"]+"', flags: 'i' },
          { label: 'H1 mentions React', pattern: '<h1>[^<]*react[^<]*</h1>', flags: 'i' },
        ],
      },
    },
  ],
};
