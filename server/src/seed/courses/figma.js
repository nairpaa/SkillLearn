// Kursus Figma: dasar UI sampai login screen buatan sendiri.
export default {
  slug: 'figma',
  title: 'Figma for Beginners: UI Basics',
  category: 'design',
  type: 'Video',
  level: 'Beginner',
  rating: 4.7,
  author: 'Nadia Putri',
  description: 'Frames, auto layout and components in Figma. You finish with a login screen you designed yourself.',
  thumbnailUrl: null,
  lessons: [
    {
      title: 'Welcome to Figma',
      type: 'Video',
      minutes: 14,
      videoId: 'jQ1sfKIl50E',
      videoStart: 0,
      contentMd: `- Create a free account at figma.com and open a new **Design file** so you can follow along.
- The first half covers the basics. From 7:29 the video previews auto layout, components and prototyping, which get their own lessons later in this course.`,
    },
    {
      title: 'The Figma workspace',
      type: 'Article',
      minutes: 7,
      contentMd: `Before you design anything, it helps to know where things live in Figma. The editor has four areas you will use all the time: the toolbar, the layers panel, the canvas and the properties panel.

## The four main areas

- **Toolbar**: tools for move, frame, shapes, pen, text and comments.
- **Layers panel** (left): every frame, group and element on the current page, shown as a tree. Items higher in the list sit on top.
- **Canvas** (centre): the infinite board where you draw. Zoom with Ctrl/Cmd + scroll and pan by holding Space while you drag.
- **Properties panel** (right): position, size, auto layout, fill, stroke, effects and export settings for whatever you selected.

## Frames, groups and layers

A **frame** is like an artboard: a container with its own size, fill and clipping. Screens are frames, and so are the buttons and cards inside them. A **group** only bundles layers together; it has no size or styling of its own. Prefer frames for anything that needs padding, a background or auto layout.

When you pick the frame tool, the right panel lists presets such as iPhone, Android and Desktop. Start every screen from one of these so your sizes match real devices.

## Shortcuts worth learning on day one

1. \`F\` or \`A\`: frame tool.
2. \`R\` rectangle, \`O\` ellipse, \`T\` text.
3. \`Shift + A\`: add auto layout to the selection.
4. \`Ctrl/Cmd + Alt + K\`: create a component.
5. \`Shift + 1\`: zoom to fit everything on the page.
6. \`Ctrl/Cmd + D\`: duplicate the selection.

## Naming and pages

Name your layers as you go ("Email input", "Login button") instead of leaving "Rectangle 12". Developers who inspect your file, and you in three weeks, will thank you. Use separate pages for explorations, final screens and shared components so the file stays tidy.

## Sharing and collaboration

Figma files live in the cloud. Use the **Share** button to invite classmates as viewers or editors, and press \`C\` to leave comments pinned to an exact spot on the canvas. Version history lets you go back to any earlier state.

> **Tip:** hold \`Alt\` (Option on Mac) and hover over another layer to see the exact distance between it and your selection.`,
    },
    {
      title: 'Frames, shapes & text',
      type: 'Video',
      minutes: 25,
      videoId: 'FTFaQWZBqQ8',
      videoStart: 0,
      contentMd: `- Amr's method: learn the basics by copying an existing design. Duplicate the template from the video or any Figma Community file.
- Follow the chapters: frames, shapes and color, corner radius, icons, images, text and finally a button.
- Pause after each chapter and rebuild that part yourself without looking.`,
    },
    {
      title: 'Auto layout',
      type: 'Video',
      minutes: 10,
      videoId: 'WxSYc5afjDY',
      videoStart: 0,
      contentMd: `- Select layers and press \`Shift + A\` to wrap them in an auto layout frame.
- Set direction, gap and padding in the right panel, and use **Hug** and **Fill** to control how children resize.
- Build a button and a form column with auto layout now; you will reuse them in the final practice.`,
    },
    {
      title: 'Components & variants',
      type: 'Video',
      minutes: 13,
      videoId: 'aGvWDDPsjUM',
      videoStart: 0,
      contentMd: `- A **component** is a reusable element: edit the main component and every instance updates.
- **Variants** group the states of one component (Default, Hover, Disabled) into a single set, and **component properties** let you switch text, icons and states from the right panel.`,
    },
    {
      title: 'Spacing & type for UI',
      type: 'Article',
      minutes: 8,
      contentMd: `Good UI rarely comes from fancy effects. It comes from consistent spacing and readable text. Two simple systems, an 8-point spacing grid and a small type scale, make your screens look intentional.

## Use an 8-point spacing grid

Pick spacing values from a short list: 4, 8, 12, 16, 24, 32, 48. Use small values inside components (between an icon and its label) and larger values between groups (between the form and the footer). In Figma, type these numbers into the **padding** and **gap** of your auto layout frames instead of nudging layers by hand.

Related items sit close together; unrelated items get more space. This is the law of proximity, and it does more for clarity than borders or divider lines.

## Build a small type scale

Most apps need only four or five text styles. Here is a scale written the way developers will see it in Dev Mode:

\`\`\`css
.display { font-size: 32px; line-height: 40px; font-weight: 700; }
.title   { font-size: 20px; line-height: 28px; font-weight: 600; }
.body    { font-size: 16px; line-height: 24px; font-weight: 400; }
.label   { font-size: 14px; line-height: 20px; font-weight: 600; }
.caption { font-size: 12px; line-height: 16px; font-weight: 400; }
\`\`\`

Save each one as a **text style** in Figma so you can reuse and update it everywhere. Body text on mobile should be at least 16px, and a line height of about 1.4 to 1.6 times the font size keeps paragraphs easy to read.

## Touch targets and alignment

Buttons and inputs need a touch target of at least 44 × 44 pt on iOS or 48 × 48 dp on Android, even if the visible shape is smaller. Align text to a shared left edge; centred text is fine for short headings but tiring in long paragraphs.

## Rules to remember

1. Choose spacing from the 8-point list, never random numbers like 13 or 27.
2. Keep the number of text styles small and save them as styles.
3. Make tappable elements at least 44 px tall.
4. Use space before boxes and lines to group content.

> **Tip:** when your padding and text styles are consistent, Dev Mode shows clean CSS values, so developers do less guessing and your design ships closer to what you drew.`,
    },
    {
      title: 'Quiz: Figma basics',
      type: 'Quiz',
      questions: [
        {
          text: 'Which shortcut selects the Frame tool?',
          options: ['R', 'F', 'T', 'P'],
          correctIndex: 1,
          explanation: 'F (or A) is the frame tool. R draws a rectangle, T adds text and P opens the pen tool.',
          mono: true,
        },
        {
          text: 'What does auto layout do?',
          options: ['Exports frames as code', 'Picks a color palette for you', 'Arranges children in a row or column with set padding and gap, and resizes with the content', 'Snaps every layer to a 12-column grid'],
          correctIndex: 2,
          explanation: 'Auto layout works like CSS flexbox: direction, gap and padding are fixed, and the frame grows or shrinks with its content.',
          mono: false,
        },
        {
          text: 'You change the fill of a main component. What happens to its instances?',
          options: ['Nothing, instances are independent copies', 'Only instances created afterwards change', 'They are detached from the component', 'They all update, except properties you overrode on an instance'],
          correctIndex: 3,
          explanation: 'Instances inherit changes from the main component. Overrides you made on a single instance are kept.',
          mono: false,
        },
        {
          text: 'When should you use variants?',
          options: ['For the different states of one component, such as Default, Hover and Disabled', 'For the different pages of an app', 'For exporting images in several sizes', 'For storing color styles'],
          correctIndex: 0,
          explanation: 'Variants combine related versions of one component into a set you can switch between with properties.',
          mono: false,
        },
        {
          text: 'Which spacing values fit an 8-point grid?',
          options: ['5, 10, 15, 20', '8, 16, 24, 32', '7, 14, 21, 28', '6, 13, 19, 27'],
          correctIndex: 1,
          explanation: 'An 8-point grid uses multiples of 8 (with 4 for small gaps), which keeps spacing consistent across screens.',
          mono: true,
        },
      ],
    },
    {
      title: 'Prototyping your screens',
      type: 'Video',
      minutes: 8,
      videoId: '1ucLq6JTxac',
      videoStart: 0,
      contentMd: `- Switch to the **Prototype** tab, drag the blue handle from a button to another frame, then choose a trigger (On click) and an action (Navigate to).
- Press Play to test it, or open the Figma mobile app to try the prototype on your phone.`,
    },
    {
      title: 'Practice: Design a login screen',
      type: 'Practice',
      minutes: 35,
      contentMd: 'Design a login screen in Figma with a phone frame, auto layout and a button component. Then fill in this spec sheet so a developer could build the screen from your notes alone.',
      practice: {
        fileName: 'login-spec.md',
        language: 'markdown',
        starterCode: `# Login screen spec

## Frame
- Device: 
- Size (width x height): 

## Auto layout
- Direction: 
- Padding: 
- Gap between items: 

## Colors
- Primary: 
- Background: 
- Text: 

## Components
- Button variants: 
- Input states: 
`,
        tasks: [
          'Create a phone frame (for example 390 x 844) and note its size',
          'Stack the form with vertical auto layout and record padding and gap',
          'Pick primary, background and text colors as hex codes',
          'Make the button a component with at least two variants',
        ],
        hint: 'Select the logo, inputs and button, press Shift + A, then read Padding and Gap from the right panel. Copy each hex code from the Fill section of the layer.',
        checks: [
          { label: 'Frame size has a width and height', pattern: 'Size \\(width x height\\):[ \\t]*\\d{3,4}\\s*[x×]\\s*\\d{3,4}', flags: 'i' },
          { label: 'Auto layout direction is set', pattern: 'Direction:[ \\t]*(vertical|horizontal)', flags: 'i' },
          { label: 'Padding and gap are numbers', pattern: 'Padding:[ \\t]*\\d+[\\s\\S]*Gap between items:[ \\t]*\\d+', flags: 'i' },
          { label: 'Primary, background and text are hex codes', pattern: 'Primary:[ \\t]*#[0-9a-fA-F]{6}[\\s\\S]*Background:[ \\t]*#[0-9a-fA-F]{6}[\\s\\S]*Text:[ \\t]*#[0-9a-fA-F]{6}', flags: '' },
          { label: 'Button lists at least two variants', pattern: 'Button variants:[ \\t]*\\w[^\\n,]*,[ \\t]*\\w', flags: 'i' },
        ],
      },
    },
  ],
};
