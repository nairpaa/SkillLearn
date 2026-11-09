export const CATS = [
  { id: 'programming', name: 'Programming', tint: '#DCE8F7', fg: '#1F4E8C', desc: 'Web development, JavaScript and React, from first lines of code to small working apps.' },
  { id: 'design', name: 'Graphic Design', tint: '#F8E3DA', fg: '#A4472A', desc: 'UI basics, color, layout and Figma, with exercises you can add to a portfolio.' },
  { id: 'marketing', name: 'Digital Marketing', tint: '#F6ECCF', fg: '#7A5510', desc: 'SEO, content and social ads, explained with real campaign examples.' },
  { id: 'technology', name: 'Technology', tint: '#DCEEE3', fg: '#2D6B4A', desc: 'Cloud, Git and the everyday tools used by tech teams.' }
];

export const COURSES = [
  { id: 'react', title: 'React Fundamentals: Build Your First App', cat: 'programming', type: 'Video', lessons: 12, dur: '3h 20m', level: 'Beginner', rating: '4.8', author: 'Rizky Pratama', progress: 64, current: 2, desc: 'Learn components, props and state by building a small to-do app. Each lesson mixes a short video, an article and a quiz.' },
  { id: 'js-quiz', title: 'JavaScript Quiz Sprint', cat: 'programming', type: 'Quiz', lessons: 5, dur: '50 questions', level: 'Intermediate', rating: '4.5', author: 'Dimas Aditya', progress: 0, current: 0, desc: 'Five short quiz sets on arrays, objects, async code and the DOM. Good for checking what you already know.' },
  { id: 'figma', title: 'Figma for Beginners: UI Basics', cat: 'design', type: 'Video', lessons: 9, dur: '2h 10m', level: 'Beginner', rating: '4.7', author: 'Nadia Putri', progress: 30, current: 1, desc: 'Frames, auto layout and components in Figma. You finish with a login screen you designed yourself.' },
  { id: 'color', title: 'Color Theory for Designers', cat: 'design', type: 'Article', lessons: 6, dur: '50m', level: 'Beginner', rating: '4.9', author: 'Nadia Putri', progress: 0, current: 0, desc: 'Hue, contrast and palettes, with examples of what works on screens and what does not.' },
  { id: 'seo', title: 'SEO & Content Marketing 101', cat: 'marketing', type: 'Article', lessons: 8, dur: '1h 30m', level: 'Beginner', rating: '4.6', author: 'Sari Wulandari', progress: 0, current: 0, desc: 'Keyword research, writing for search and measuring results with free tools.' },
  { id: 'ads', title: 'Social Media Ads for Beginners', cat: 'marketing', type: 'Video', lessons: 7, dur: '1h 45m', level: 'Beginner', rating: '4.4', author: 'Sari Wulandari', progress: 0, current: 0, desc: 'Plan a small budget campaign, write ad copy and read the results dashboard.' },
  { id: 'cloud', title: 'Intro to Cloud Computing', cat: 'technology', type: 'Video', lessons: 10, dur: '2h 45m', level: 'Intermediate', rating: '4.7', author: 'Andi Saputra', progress: 0, current: 0, desc: 'What the cloud is, the main service models, and how to deploy a simple app.' },
  { id: 'git', title: 'Git & GitHub Essentials', cat: 'technology', type: 'Practice', lessons: 6, dur: '1h 40m', level: 'Beginner', rating: '4.8', author: 'Andi Saputra', progress: 0, current: 0, desc: 'Commits, branches and pull requests, practiced in a sandbox repository.' }
];

const REACT_LESSONS = [
  ['Welcome & setup', 'Video', '8 min'], ['JSX explained', 'Article', '6 min read'],
  ['Components & props', 'Video', '14 min'], ['State with useState', 'Video', '18 min'],
  ['Quiz: Components', 'Quiz', '3 questions'], ['Practice: Build a to-do list', 'Practice', '30 min']
];
const GENERIC = [
  ['Introduction', 'Video', '6 min'], ['Key concepts', 'Article', '8 min read'],
  ['Step-by-step tutorial', 'Video', '15 min'], ['Check your understanding', 'Quiz', '3 questions'],
  ['Hands-on practice', 'Practice', '25 min']
];

export const HISTORY = [
  { title: 'Components & props', course: 'react', type: 'Video', when: 'Today, 09:40' },
  { title: 'JSX explained', course: 'react', type: 'Article', when: 'Yesterday' },
  { title: 'Check your understanding', course: 'figma', type: 'Quiz', when: '6 Nov' },
  { title: 'Key concepts', course: 'seo', type: 'Article', when: '4 Nov' },
  { title: 'Hands-on practice', course: 'figma', type: 'Practice', when: '2 Nov' }
];

export const QUIZ = [
  { q: 'How do you pass a value named title to a Card component?', code: 'title', opts: ['<Card title="Hello" />', '<Card {title: "Hello"} />', 'Card.title = "Hello"', '<Card>title=Hello</Card>'], correct: 0, mono: true, why: 'Props are passed like HTML attributes: <Card title="Hello" />.' },
  { q: 'Which hook stores local state in a function component?', opts: ['useEffect', 'useState', 'useRef', 'useMemo'], correct: 1, mono: true, why: 'useState returns the current value and a setter function.' },
  { q: 'What must a component return?', opts: ['An array of strings', 'A CSS file', 'A single root element or a fragment', 'A promise'], correct: 2, mono: false, why: 'Wrap sibling elements in a <div> or a fragment <>…</>.' }
];

export const PRACTICE_TASKS = [
  'Create state for the todo list and the input text',
  'Add a todo when Add is clicked',
  'Render every todo with map()',
  'Clear the input after adding'
];

export const CODE = {
  article: 'const el = <h1 className="title">Hello</h1>;\n\n// compiles to\nconst el = React.createElement("h1", { className: "title" }, "Hello");',
  mobile: 'const el = <h1>Hello</h1>;\n\n// compiles to\nReact.createElement("h1", null,\n  "Hello");',
  practice: 'import { useState } from "react";\n\nexport default function App() {\n  const [todos, setTodos] = useState([]);\n  const [text, setText] = useState("");\n\n  const addTodo = () => {\n    setTodos([...todos, text]);\n    setText("");\n  };\n\n  return (\n    <div>\n      <input value={text} onChange={e => setText(e.target.value)} />\n      <button onClick={addTodo}>Add</button>\n      <ul>{todos.map(t => <li key={t}>{t}</li>)}</ul>\n    </div>\n  );\n}'
};

const COL = { com: '#8A9693', str: '#9FD8C6', tag: '#8FB8F0', kw: '#F2A93B', fn: '#E9D59A', attr: '#F4B9A4', pun: '#B9C4C1', txt: '#E7F3F0' };
export function hl(code) {
  return code.split('\n').map((line, i) => {
    const toks = [];
    const re = /(\/\/.*)|("(?:[^"\\]|\\.)*")|(<\/?)([A-Za-z][\w.]*)|\b(import|from|export|default|function|const|let|return|null)\b|\b([A-Za-z_]\w*)(?=\()|\b([a-z][A-Za-z]*)(?==[^=>])|(=>|\/?>|[{}()[\];,.=])/g;
    let last = 0, m;
    const push = (t, k) => t && toks.push({ t, c: COL[k], i: k === 'com' ? 'italic' : 'normal' });
    while ((m = re.exec(line))) {
      push(line.slice(last, m.index), 'txt');
      if (m[1]) push(m[1], 'com'); else if (m[2]) push(m[2], 'str');
      else if (m[3]) { push(m[3], 'pun'); push(m[4], 'tag'); }
      else if (m[5]) push(m[5], 'kw'); else if (m[6]) push(m[6], 'fn');
      else if (m[7]) push(m[7], 'attr'); else push(m[8], 'pun');
      last = re.lastIndex;
    }
    push(line.slice(last), 'txt');
    return { n: i + 1, toks };
  });
}

const KEY = 'skilllearn-favs';
const UKEY = 'skilllearn-user';
export const DEMO_USER = { name: 'Alya Rahma', email: 'alya@student.ac.id', isNew: false, joined: 'March 2026', bio: 'Informatics student. Learning React and UI design.', interests: ['Programming', 'Graphic Design'] };
export function getUser() {
  try { const u = JSON.parse(localStorage.getItem(UKEY)); if (u && u.name) return u; } catch (e) {}
  return DEMO_USER;
}
export function setUser(u) { localStorage.setItem(UKEY, JSON.stringify(u)); }
export function logout() { localStorage.removeItem(UKEY); localStorage.removeItem(KEY); }
export const initials = (n) => (n || '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
export const firstName = (n) => (n || '').trim().split(' ')[0] || 'there';
export function getFavs() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(v)) return v; } catch (e) {}
  return getUser().isNew ? [] : ['react', 'figma', 'js-quiz'];
}
// Simulated API request. Add "error=1" to the URL hash to see the error state.
export function load() {
  return new Promise((res, rej) => setTimeout(() => (param('error') ? rej(new Error('Network request failed')) : res()), 450));
}
export function toast(p, msg, undo) {
  document.querySelectorAll('[data-sl-toast]').forEach(n => n.remove());
  const el = document.createElement('div');
  el.setAttribute('data-sl-toast', ''); el.setAttribute('role', 'status');
  el.style.cssText = (p === 'web' ? 'left:24px;bottom:24px;min-width:300px;' : 'left:50%;transform:translateX(-50%);bottom:100px;width:calc(100% - 40px);max-width:350px;') +
    "position:fixed;z-index:1000;background:#16211F;color:#fff;border-radius:12px;padding:10px 10px 10px 16px;display:flex;align-items:center;gap:16px;font:600 14px 'Plus Jakarta Sans',system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2)";
  const t = document.createElement('span'); t.textContent = msg; t.style.flex = '1'; el.appendChild(t);
  if (undo) {
    const b = document.createElement('button'); b.textContent = 'Undo';
    b.style.cssText = "border:0;background:transparent;color:#F2A93B;font:700 14px 'Plus Jakarta Sans',sans-serif;cursor:pointer;padding:0 10px;min-height:36px";
    b.onclick = () => { undo(); el.remove(); }; el.appendChild(b);
  }
  document.body.appendChild(el); setTimeout(() => el.remove(), 3500);
}
export function toggleFav(id) {
  const f = getFavs();
  const n = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
  localStorage.setItem(KEY, JSON.stringify(n));
  return n;
}

export const param = (k) => new URLSearchParams(location.hash.slice(1)).get(k);
export const page = (p, name, q) => `${p === 'web' ? 'Web' : 'Mobile'} - ${name}.dc.html${q ? '#' + q : ''}`;
export const go = (url) => { location.href = url; };
export const cat = (id) => CATS.find(c => c.id === id) || CATS[0];
export const findCourse = (id) => COURSES.find(c => c.id === id);
export const findCat = (id) => CATS.find(c => c.id === id);
export const course = (id) => { const c = findCourse(id) || COURSES[0]; return getUser().isNew ? { ...c, progress: 0, current: 0 } : c; };

const PAGE_FOR = { Video: 'Course Detail', Article: 'Article', Quiz: 'Quiz', Practice: 'Practice' };
export function lessons(p, c) {
  const list = c.id === 'react' ? REACT_LESSONS : GENERIC;
  return list.map(([title, type, dur], i) => {
    const s = i < c.current ? 'done' : i === c.current ? 'current' : 'todo';
    return {
      title, type, dur, href: page(p, PAGE_FOR[type], 'c=' + c.id),
      mark: s === 'done' ? '✓' : String(i + 1),
      numBg: s === 'done' ? '#0E5E52' : s === 'current' ? '#F2A93B' : '#EEF1F0',
      numFg: s === 'done' ? '#fff' : '#16211F',
      rowBg: s === 'current' ? '#E7F3F0' : 'transparent'
    };
  });
}

export function card(p, c, favs, onToggle) {
  const k = cat(c.cat), fav = favs.includes(c.id);
  return {
    ...c, catName: k.name, tint: k.tint, fg: k.fg,
    meta: `${c.type} · ${c.lessons} ${c.type === 'Quiz' ? 'sets' : 'lessons'} · ${c.dur}`,
    href: page(p, 'Course Detail', 'c=' + c.id), fav,
    favFill: fav ? '#0E5E52' : 'none', favStroke: fav ? '#0E5E52' : '#4A5856',
    favLabel: fav ? 'Saved' : 'Save',
    toggle: (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const n = toggleFav(c.id); onToggle(n);
      toast(p, n.includes(c.id) ? 'Saved to favorites' : 'Removed from favorites', () => onToggle(toggleFav(c.id)));
    }
  };
}

export function history(p) {
  if (getUser().isNew) return [];
  return HISTORY.map(h => {
    const c = course(h.course);
    return { ...h, courseTitle: c.title, href: page(p, PAGE_FOR[h.type], 'c=' + c.id) };
  });
}

export function search(q, type) {
  const s = (q || '').trim().toLowerCase();
  return COURSES.filter(c => (!type || type === 'All' || c.type === type) &&
    (!s || (c.title + ' ' + cat(c.cat).name + ' ' + c.desc + ' ' + c.author).toLowerCase().includes(s)));
}
