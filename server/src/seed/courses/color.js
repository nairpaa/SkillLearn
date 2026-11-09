// Kursus teori warna: mayoritas artikel, ditutup dengan latihan palet CSS.
export default {
  slug: 'color',
  title: 'Color Theory for Designers',
  category: 'design',
  type: 'Article',
  level: 'Beginner',
  rating: 4.9,
  author: 'Nadia Putri',
  description: 'Hue, contrast and palettes, with examples of what works on screens and what does not.',
  thumbnailUrl: null,
  lessons: [
    {
      title: 'Hue, saturation and lightness',
      type: 'Article',
      minutes: 7,
      contentMd: `Every color on a screen is a mix of red, green and blue light. That is precise, but not very intuitive. Designers usually think in three other dimensions instead: hue, saturation and lightness, which is exactly what the HSL color model describes.

## The three dimensions

- **Hue** is the color family, measured in degrees around the color wheel: 0° is red, 120° is green and 240° is blue.
- **Saturation** is how intense the color is. 100% is vivid; 0% is a neutral grey.
- **Lightness** runs from 0% (black) through the pure color at 50% to 100% (white).

## Writing colors in CSS

The same dark teal can be written three ways:

\`\`\`css
.badge {
  color: #0E5E52;          /* hex: red, green, blue in base 16 */
  color: rgb(14 94 82);     /* rgb: 0-255 per channel */
  color: hsl(171 74% 21%);  /* hsl: hue, saturation, lightness */
}
\`\`\`

Hex is compact and what most tools copy, but HSL is easier to adjust by hand. To make a light tint for a background, keep the hue and raise the lightness; to make a muted version, lower the saturation.

## Tints, shades and tones

- A **tint** adds white (higher lightness).
- A **shade** adds black (lower lightness).
- A **tone** adds grey (lower saturation).

A typical UI palette takes one brand hue and builds a ramp of 8 to 10 steps from very light (backgrounds) to very dark (text and borders). Every step shares the same hue, so the palette feels related.

## Warm and cool colors

Reds, oranges and yellows feel warm and energetic; blues and greens feel calm and stable. Warm colors also seem to come forward, which makes them good for small accents and calls to action, while cool colors recede and work well for large backgrounds.

## Rules to remember

1. Pick colors by hue first, then adjust saturation and lightness.
2. Build tints and shades from one hue instead of picking unrelated colors.
3. Use very saturated colors in small areas only.
4. Keep the final hex codes in one place, such as CSS variables or Figma styles.

> **Tip:** in Figma's color picker, switch the format from Hex to HSL and change only the lightness value to build a consistent ramp in minutes.`,
    },
    {
      title: 'Color basics',
      type: 'Video',
      minutes: 7,
      videoId: '_2LLXnUdUIc',
      videoStart: 0,
      contentMd: `- The video covers the color wheel, hue, saturation and value, and the classic color schemes such as complementary and analogous.
- While you watch, open two apps on your phone and decide which scheme each one uses.`,
    },
    {
      title: 'Contrast & accessibility',
      type: 'Article',
      minutes: 8,
      contentMd: `A beautiful palette is useless if people cannot read the text. Contrast is the difference in brightness between text and its background, and it matters for everyone: people with low vision, older users, and anyone reading a phone in bright sunlight.

## Contrast ratios

The Web Content Accessibility Guidelines (WCAG) measure contrast as a ratio from 1:1 (no difference) to 21:1 (black on white). Level AA, the usual target for apps and websites, asks for:

1. **4.5:1** for normal body text.
2. **3:1** for large text (about 24px regular, or 18.5px bold and up).
3. **3:1** for icons, input borders and other important parts of the interface.

## Checking contrast

You do not need to calculate ratios by hand. Paste two hex codes into the WebAIM Contrast Checker, use the contrast info in Chrome DevTools, or install a Figma contrast plugin.

\`\`\`css
/* Fails AA: about 2.5:1 on white */
.hint { color: #9AA5A3; background: #FFFFFF; }

/* Passes AA: about 7.4:1 on white */
.hint { color: #4A5856; background: #FFFFFF; }
\`\`\`

A useful number to remember: \`#767676\` is roughly the lightest grey that still reaches 4.5:1 on a white background.

## Do not rely on color alone

About 1 in 12 men has some form of color vision deficiency, most often red-green. If an error is shown only by turning a border red, some users will miss it. Always add a second signal: an icon, a short message, or an underline for links.

## Light and dark themes

Pure white text on pure black can feel harsh and look blurry to some readers. In dark mode, use an off-black background such as \`#16211F\` and slightly off-white text. Check contrast again for every theme, because a color that passes on white often fails on dark grey.

> **Tip:** squint at your screen or blur a screenshot. Whatever disappears first probably has too little contrast.`,
    },
    {
      title: 'Building a UI palette',
      type: 'Article',
      minutes: 8,
      contentMd: `A UI palette is not just a set of nice colors. Each color has a job: background, surface, text, primary action, feedback. Assigning roles first and picking colors second keeps an interface consistent as it grows.

## The 60-30-10 rule

Borrowed from interior design, this rule splits a screen roughly into three parts:

- **60%** dominant color: page backgrounds and large areas, usually a light neutral.
- **30%** secondary color: cards, panels and navigation.
- **10%** accent: buttons, links and active states, the things you want people to click.

It is a guideline, not a law, but it stops the accent from losing its power by appearing everywhere.

## Color harmonies

The color wheel offers a few reliable starting points:

1. **Monochromatic**: one hue in several lightness steps. Calm and safe.
2. **Analogous**: neighbours on the wheel, such as teal, green and blue.
3. **Complementary**: opposites, such as teal and orange. High energy, so use the second color sparingly.
4. **Triadic**: three hues evenly spaced. Lively but harder to balance.

## Define roles in code

Name colors by their role, not their appearance, so you can change the actual color later without renaming anything:

\`\`\`css
:root {
  --color-background: #F5F7F6;
  --color-surface:    #FFFFFF;
  --color-text:       #16211F;
  --color-primary:    #0E5E52;
  --color-accent:     #F2A93B;
  --color-danger:     #B42318;
}
\`\`\`

\`--color-primary\` is better than \`--teal\`, because next year's rebrand might make it purple.

## Semantic colors

Users expect green for success, yellow or orange for warnings and red for errors. Keep these consistent across the whole app, and do not reuse your error red as a decorative brand color, or people will think something went wrong.

> **Tip:** design in greyscale first. When the layout and hierarchy work without color, add the accent only where you want attention.`,
    },
    {
      title: 'Quiz: Color theory',
      type: 'Quiz',
      questions: [
        {
          text: 'In hsl(171 74% 21%), what does 171 describe?',
          options: ['The hue, as an angle on the color wheel', 'The lightness', 'The saturation', 'The opacity'],
          correctIndex: 0,
          explanation: 'HSL lists hue (0-360 degrees), then saturation and lightness as percentages.',
          mono: false,
        },
        {
          text: 'What is the minimum WCAG AA contrast ratio for normal body text?',
          options: ['2:1', '3:1', '4.5:1', '7:1'],
          correctIndex: 2,
          explanation: 'AA requires 4.5:1 for body text and 3:1 for large text. 7:1 is the stricter AAA level.',
          mono: true,
        },
        {
          text: 'Complementary colors are…',
          options: ['Next to each other on the color wheel', 'Different shades of one hue', 'Three hues evenly spaced', 'Opposite each other on the color wheel'],
          correctIndex: 3,
          explanation: 'Complementary pairs, such as blue and orange, sit across the wheel and create strong contrast.',
          mono: false,
        },
        {
          text: 'In the 60-30-10 rule, what usually gets the 10%?',
          options: ['The page background', 'Accent elements like buttons and links', 'Cards and panels', 'Body text'],
          correctIndex: 1,
          explanation: 'The accent is used sparingly so that it draws the eye to the actions that matter.',
          mono: false,
        },
        {
          text: 'A form shows errors only by turning the input border red. What is the problem?',
          options: ['Users with color vision deficiency may miss it, so add an icon or text', 'Red borders are not supported on mobile', 'Red makes the page load slower', 'Nothing, red always means error'],
          correctIndex: 0,
          explanation: 'Never rely on color alone. Pair the color with a message or icon so everyone notices the error.',
          mono: false,
        },
      ],
    },
    {
      title: 'Practice: Build a UI palette',
      type: 'Practice',
      minutes: 15,
      contentMd: 'Create a five-color palette for a study app. Give every CSS variable a hex code, then use the variables in the `body`, `.card` and `.button` rules instead of raw colors.',
      practice: {
        fileName: 'palette.css',
        language: 'css',
        starterCode: `/* Study app palette: replace every ??? */
:root {
  --color-background: ???; /* 60%: page background */
  --color-surface: ???;    /* 30%: cards and panels */
  --color-primary: ???;    /* 10%: buttons and links */
  --color-accent: ???;     /* badges and highlights */
  --color-text: ???;       /* body text, 4.5:1 on the background */
}

body {
  background: ???;
  color: ???;
}

.card {
  background: ???;
}

.button {
  background: ???;
  color: #FFFFFF;
}
`,
        tasks: [
          'Pick a light background and a dark text color with at least 4.5:1 contrast',
          'Choose a surface color for cards (the 30%)',
          'Choose a primary color for buttons and an accent that fits it',
          'Use the variables in body, .card and .button instead of hex codes',
        ],
        hint: 'Start with the text and background pair and test it in the WebAIM Contrast Checker. Then write var(--color-primary) and friends in the rules below :root.',
        checks: [
          { label: 'Background and text are hex codes', pattern: '--color-background:\\s*#[0-9a-fA-F]{6}\\b[\\s\\S]*--color-text:\\s*#[0-9a-fA-F]{6}\\b', flags: '' },
          { label: 'All five variables have a hex code', pattern: '(--color-[a-z]+:\\s*#[0-9a-fA-F]{6}\\s*;[\\s\\S]*?){5}', flags: '' },
          { label: 'Rules use var(--color-…)', pattern: '(var\\(--color-[a-z]+\\)[\\s\\S]*?){4}', flags: '' },
          { label: 'Button uses the primary color', pattern: '\\.button\\s*\\{[^}]*background:\\s*var\\(--color-primary\\)', flags: '' },
          { label: 'No ??? placeholders left', pattern: '^(?![\\s\\S]*\\?\\?\\?)', flags: '' },
        ],
      },
    },
  ],
};
