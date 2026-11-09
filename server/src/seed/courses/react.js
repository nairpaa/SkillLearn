// Kursus React: 6 lesson pertama persis mengikuti desain, sisanya lanjutan (hooks & data).
export default {
  slug: 'react',
  title: 'React Fundamentals: Build Your First App',
  category: 'programming',
  type: 'Video',
  level: 'Beginner',
  rating: 4.8,
  author: 'Rizky Pratama',
  description: 'Learn components, props and state by building a small to-do app. Each lesson mixes a short video, an article and a quiz.',
  thumbnailUrl: null,
  lessons: [
    {
      title: 'Welcome & setup',
      type: 'Video',
      minutes: 8,
      videoId: 'SqcY0GlETPk',
      videoStart: 163,
      contentMd: `- The video starts at *What is React?* and you can stop after *Project Structure* (about 8 minutes).
- Mosh picks TypeScript. This course uses plain JavaScript, so choose the **React → JavaScript** template when Vite asks.
- Start the dev server with \`npm run dev\` and open the local URL it prints.`,
    },
    {
      title: 'JSX explained',
      type: 'Article',
      minutes: 6,
      contentMd: `JSX is a syntax extension that lets you write markup inside JavaScript. It looks like HTML, but every tag is turned into a function call before the browser runs it.

## What JSX compiles to

\`\`\`jsx
const el = <h1 className="title">Hello</h1>;

// compiles to
const el = React.createElement("h1", { className: "title" }, "Hello");
\`\`\`

Because JSX is JavaScript, you can put any expression inside curly braces: variables, function calls, or a map over an array. Attributes use camelCase, so \`class\` becomes \`className\`.

## Expressions inside curly braces

Anything that produces a value can go between \`{\` and \`}\`. Statements such as \`if\` or \`for\` cannot, so use a ternary or \`&&\` for conditions and \`map()\` for lists.

\`\`\`jsx
const name = "Alya";
const tasks = ["Read", "Code", "Rest"];

return (
  <section>
    <h2>Hi, {name.toUpperCase()}!</h2>
    {tasks.length === 0 && <p>Nothing to do.</p>}
    <ul>{tasks.map(t => <li key={t}>{t}</li>)}</ul>
  </section>
);
\`\`\`

## Attributes and events

Most attributes look the same as in HTML, but a few are renamed because they clash with JavaScript keywords: \`className\` instead of \`class\` and \`htmlFor\` instead of \`for\`. Event handlers are camelCase too (\`onClick\`, \`onChange\`) and take a function, not a string. Inline styles are objects with camelCase keys, for example \`style={{ fontSize: 18 }}\`.

JSX also escapes values for you. If a user types \`<script>\` into a form and you render it with \`{text}\`, React shows it as plain text instead of running it.

## Components start with a capital letter

JSX treats lowercase tags as HTML elements and capitalised tags as components: \`<button>\` is the browser's button, while \`<Button>\` is a function you wrote. If you name a component \`button\`, React will quietly render an empty HTML element instead of calling your code.

## Rules to remember

1. Close every tag, including self-closing ones like \`<img />\`.
2. Return one root element per component.
3. Use curly braces for JavaScript values, quotes for plain strings.

> **Tip:** wrap siblings in a \`<div>\` or a fragment \`<>…</>\`.`,
    },
    {
      title: 'Components & props',
      type: 'Video',
      minutes: 14,
      videoId: 'uvEAvxWvwOs',
      videoStart: 0,
      contentMd: `- Props are read-only values a parent passes to a child, written like HTML attributes: \`<Student name="Alya" age={20} />\`.
- Read them by destructuring in the function signature: \`function Student({ name, age })\`.
- The video also shows \`propTypes\` and \`defaultProps\`. In modern React you can skip both and set defaults in the signature instead: \`function Student({ name = "Guest" })\`.`,
    },
    {
      title: 'State with useState',
      type: 'Video',
      minutes: 18,
      videoId: 'O6P86uwfdR0',
      videoStart: 0,
      contentMd: `- \`const [count, setCount] = useState(0)\` gives you the current value and a setter. Calling the setter re-renders the component.
- When the new value depends on the old one, pass a function: \`setCount(c => c + 1)\`.
- The first 4 minutes compare hooks with old class components. Skip to 4:22 if you only want \`useState\` itself.`,
    },
    {
      title: 'Quiz: Components',
      type: 'Quiz',
      questions: [
        {
          text: 'How do you pass a value named title to a Card component?',
          options: ['<Card title="Hello" />', '<Card {title: "Hello"} />', 'Card.title = "Hello"', '<Card>title=Hello</Card>'],
          correctIndex: 0,
          explanation: 'Props are passed like HTML attributes: <Card title="Hello" />.',
          mono: true,
        },
        {
          text: 'Which hook stores local state in a function component?',
          options: ['useEffect', 'useState', 'useRef', 'useMemo'],
          correctIndex: 1,
          explanation: 'useState returns the current value and a setter function.',
          mono: true,
        },
        {
          text: 'What must a component return?',
          options: ['An array of strings', 'A CSS file', 'A single root element or a fragment', 'A promise'],
          correctIndex: 2,
          explanation: 'Wrap sibling elements in a <div> or a fragment <>…</>.',
          mono: false,
        },
      ],
    },
    {
      title: 'Practice: Build a to-do list',
      type: 'Practice',
      minutes: 30,
      contentMd: 'Use `useState` to build a small to-do app. Type a task, click Add, and show it in a list below the input.',
      practice: {
        fileName: 'App.jsx',
        language: 'jsx',
        starterCode: `import { useState } from "react";

export default function App() {
  // TODO: create state for the todo list and the input text

  const addTodo = () => {
    // TODO: add the text to the list, then clear the input
  };

  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {/* TODO: render every todo with map() */}
      </ul>
    </div>
  );
}`,
        tasks: [
          'Create state for the todo list and the input text',
          'Add a todo when Add is clicked',
          'Render every todo with map()',
          'Clear the input after adding',
        ],
        hint: 'Spread the old array into a new one: setTodos([...todos, text]). Never push() into state, because React only re-renders when it receives a new array.',
        checks: [
          { label: 'Creates the todo list with useState([])', pattern: 'useState\\(\\s*\\[\\s*\\]\\s*\\)', flags: '' },
          { label: 'Creates the input text with useState("")', pattern: 'useState\\(\\s*(["\'])\\1\\s*\\)', flags: '' },
          { label: 'Adds the text to a new array in setTodos', pattern: 'setTodos\\(\\s*(\\[\\s*\\.\\.\\.\\s*todos\\b|todos\\.concat\\(|\\(?\\s*\\w+\\s*\\)?\\s*=>)', flags: '' },
          { label: 'Renders the list with todos.map()', pattern: 'todos\\.map\\(', flags: '' },
          { label: 'Clears the input with setText("")', pattern: 'setText\\(\\s*(["\'])\\1\\s*\\)', flags: '' },
        ],
      },
    },
    {
      title: 'Side effects with useEffect',
      type: 'Video',
      minutes: 15,
      videoId: '0ZJgIjIuY7U',
      videoStart: 0,
      contentMd: `- An effect runs **after** React renders. Use it for work outside rendering: fetching data, timers, subscriptions, changing \`document.title\`.
- The dependency array decides when it runs again: no array = after every render, \`[]\` = once, \`[id]\` = whenever \`id\` changes.
- Return a cleanup function to remove listeners or timers. The video compares this with class lifecycle methods, which you will only meet in older code.`,
    },
    {
      title: 'Lists & keys',
      type: 'Article',
      minutes: 7,
      contentMd: `Most apps show lists: messages, products, to-dos. In React you turn an array of data into an array of elements with \`map()\`, and give each element a \`key\` so React can keep track of it between renders.

## Rendering a list with map()

\`\`\`jsx
const courses = [
  { id: "react", title: "React Fundamentals" },
  { id: "figma", title: "Figma for Beginners" },
];

export default function CourseList() {
  return (
    <ul>
      {courses.map(course => (
        <li key={course.id}>{course.title}</li>
      ))}
    </ul>
  );
}
\`\`\`

\`map()\` returns a new array and React renders every element in it. The parentheses after the arrow return the JSX directly, so you do not need the \`return\` keyword.

## Why keys matter

When the list changes, React compares the new elements with the old ones. The key tells React which item is which. With a stable key, React can move, add or remove a single \`<li>\` instead of rebuilding the whole list, and it keeps the right state (for example, text typed into an input) attached to the right row.

If you leave the key out, React warns you in the console: *Each child in a list should have a unique "key" prop.*

## Choosing a good key

The best key is an ID that comes with the data, such as a database ID or a slug. The array index is only safe for lists that never reorder, filter or insert items. Random values like \`Math.random()\` are the worst choice: they change on every render, so React throws away and recreates every row.

## Rules to remember

1. Put the \`key\` on the outermost element returned from \`map()\`.
2. Keys must be unique among siblings, not across the whole app.
3. Prefer IDs from your data; use the index only for static lists.
4. A component cannot read its own \`key\`. Pass the ID as a separate prop if you need it.

> **Tip:** need only some items? Chain \`filter()\` before \`map()\`, for example \`todos.filter(t => !t.done).map(...)\`.`,
    },
    {
      title: 'Forms & controlled inputs',
      type: 'Article',
      minutes: 8,
      contentMd: `Forms are how users talk to your app. In React the usual pattern is a **controlled input**: the input shows a value from state, and every keystroke updates that state. React becomes the single source of truth for what is in the form.

## A controlled input

\`\`\`jsx
import { useState } from "react";

export default function SignupForm() {
  const [email, setEmail] = useState("");

  return (
    <input
      type="email"
      value={email}
      onChange={e => setEmail(e.target.value)}
    />
  );
}
\`\`\`

\`value\` ties the input to state and \`onChange\` keeps state in sync. If you set \`value\` without \`onChange\`, the field becomes read-only, which is a common beginner bug.

## Handling submit

Wrap inputs in a \`<form>\` and handle \`onSubmit\`. Call \`e.preventDefault()\` first, otherwise the browser reloads the page and your state is lost.

\`\`\`jsx
function handleSubmit(e) {
  e.preventDefault();
  if (!email.includes("@")) {
    setError("Enter a valid email.");
    return;
  }
  setError("");
  console.log("Sending", email);
}
\`\`\`

Using a real form instead of a button \`onClick\` also means the Enter key submits for free.

## Showing errors

Keep the error message in state too, and render it right below the field: \`{error && <p className="error">{error}</p>}\`. Clear it as soon as the input becomes valid, so users are not left staring at an old message. While a request is being sent, disable the submit button so an impatient double click does not create two accounts.

## Many fields, one state object

For bigger forms, keep the fields in one object and use each input's \`name\` to update the right key:

\`\`\`jsx
const [form, setForm] = useState({ name: "", email: "" });

const update = e =>
  setForm({ ...form, [e.target.name]: e.target.value });

<input name="email" value={form.email} onChange={update} />
\`\`\`

## Rules to remember

1. Always pair \`value\` with \`onChange\`.
2. Call \`e.preventDefault()\` in every submit handler.
3. Copy objects with the spread operator; never change state directly.
4. Use \`checked\` instead of \`value\` for checkboxes.

> **Tip:** connect every input to a \`<label htmlFor="...">\` so screen readers announce it and clicking the label focuses the field.`,
    },
    {
      title: 'Fetching data from an API',
      type: 'Video',
      minutes: 30,
      videoId: '00lxm_doFYw',
      videoStart: 0,
      contentMd: `- Fetch inside \`useEffect\` so the request runs after render, not on every keystroke.
- Keep three pieces of state: the data, a loading flag and an error message, and show each one in the UI.
- The video also uses an \`AbortController\` to cancel old requests and mentions React Query. Both are useful later; focus on the basic pattern first.`,
    },
    {
      title: 'Quiz: Hooks & data',
      type: 'Quiz',
      questions: [
        {
          text: 'When does useEffect(fn, []) run?',
          options: ['After every render', 'Once, after the first render', 'Before the first render', 'Only when the component unmounts'],
          correctIndex: 1,
          explanation: 'An empty dependency array means the effect has nothing to watch, so it runs once after the component first appears.',
          mono: false,
        },
        {
          text: 'Why does React need a key on each list item?',
          options: ['To identify which items changed, moved or were removed', 'To style each item separately', 'To sort the list automatically', 'To make the items clickable'],
          correctIndex: 0,
          explanation: 'Keys let React match old and new items, so it updates only what changed and keeps state on the right row.',
          mono: false,
        },
        {
          text: 'Which input is controlled?',
          options: ['<input />', '<input defaultValue="hi" />', '<input value={name} onChange={e => setName(e.target.value)} />', '<input ref={inputRef} />'],
          correctIndex: 2,
          explanation: 'A controlled input gets its value from state and updates that state in onChange.',
          mono: true,
        },
        {
          text: 'You render users from an API. Which key is best?',
          options: ['key={Math.random()}', 'key={index}', 'key="user"', 'key={user.id}'],
          correctIndex: 3,
          explanation: 'A stable, unique ID from the data is the best key. Random values change every render and a fixed string is not unique.',
          mono: true,
        },
        {
          text: 'An effect calls setCount and has no dependency array. What happens?',
          options: ['It runs once and stops', 'React throws a syntax error', 'It can loop forever: each update re-renders and runs the effect again', 'The effect never runs'],
          correctIndex: 2,
          explanation: 'Without a dependency array the effect runs after every render, and setting state causes another render. Add dependencies to break the loop.',
          mono: false,
        },
      ],
    },
    {
      title: 'Practice: Fetch and show users',
      type: 'Practice',
      minutes: 40,
      contentMd: 'Load users from `API_URL` when the component first renders. Show a loading message while you wait, then list every user\'s name.',
      practice: {
        fileName: 'Users.jsx',
        language: 'jsx',
        starterCode: `import { useState, useEffect } from "react";

const API_URL = "https://jsonplaceholder.typicode.com/users";

export default function Users() {
  const [users, setUsers] = useState([]);
  // TODO: add a loading state that starts as true

  // TODO: fetch the users once, after the first render

  return (
    <div>
      <h2>Users</h2>
      {/* TODO: show "Loading..." while waiting */}
      <ul>
        {/* TODO: render each user's name with a unique key */}
      </ul>
    </div>
  );
}`,
        tasks: [
          'Add a loading state and show "Loading..." while it is true',
          'Fetch the users in useEffect with an empty dependency array',
          'Save the data with setUsers and turn loading off',
          'Render each name in a list with user.id as the key',
        ],
        hint: 'Inside useEffect call fetch(API_URL), then res.json(), then pass the result to setUsers. The empty array at the end of useEffect makes it run only once.',
        checks: [
          { label: 'Creates a loading state that starts as true', pattern: 'useState\\(\\s*true\\s*\\)', flags: '' },
          { label: 'Shows a message while loading', pattern: 'loading\\s*(&&|\\?)', flags: '' },
          { label: 'Fetches inside useEffect with []', pattern: 'useEffect\\([\\s\\S]*fetch\\([\\s\\S]*,\\s*\\[\\s*\\]\\s*\\)', flags: '' },
          { label: 'Saves the response with setUsers', pattern: 'setUsers\\(\\s*\\w+', flags: '' },
          { label: 'Uses user.id as the key', pattern: 'key=\\{\\s*\\w+\\.id\\s*\\}', flags: '' },
        ],
      },
    },
  ],
};
