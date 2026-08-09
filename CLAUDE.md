# About this project

This is dukeandjb.com. A website hosting small browser games.

Duke is 9. JB is 7. They are brothers. Duke does most of the building
and talks to you. JB comes up with ideas and tests everything.

They film themselves doing this for a YouTube channel. The channel is
the point. The games are the content.

They are not learning to code and don't need to. They are learning to
run something and use AI tools to build real things.

We moved here from Roblox because anyone can play a web game by
tapping a link. No account, no download, no age check.

## Read these first

- design.md is the site's design spec. Follow it for colours, fonts
  and spacing so every game looks like part of the same site.
- Look at the existing games in /games/ before building a new one.

## Start each session (live preview)

At the very start of every session, before building anything, open the
clean preview so we can see our work in the browser on camera:

1. Start the local preview server (it is named `dukeandjb` in
   `.claude/launch.json`). It runs `_dev/serve.py` on port 8000 serving
   this folder with LIVE RELOAD built in.
2. Open the clean start page: `http://localhost:8000/start/`. This shows
   the dukeandjb branding and a "ready to build" tag. That is the blank
   canvas we start every session from.

The preview reloads itself whenever a file changes — the kids NEVER need
to press F5, and you should never ask them to. Just save your edit and
their browser refreshes on its own within about half a second. The
live-reload snippet is injected only by the dev server, so the real
dukeandjb.com files stay clean (still zero JS on the homepage).

Do NOT open a specific game (e.g. a previous session's game) at the
start. We decide together each session what we are building. Only point
the browser at a `/games/<slug>/` page once we have chosen and started
building it.

The user views the preview in their own full-screen Chrome at the same
address, and refreshes to see each change. Keep the server running for
the whole session.

## Priorities

1. Finish something every session. A working rough thing beats a
   half-built good thing.
2. Keep it filmable. Short waits, visible progress, obvious results.
3. Keep it simple enough that they can explain it on camera.

## Sessions

A session is about 30 minutes and it is being recorded.

Aim to have something playable within the first 10 minutes, even if
it is very basic. Then improve it. Never leave them staring at a
broken screen.

If time is running short, say so and get to a finished state.

## Talking to a 9 year old and a 7 year old

Plain English. Short sentences. No jargon.

Before you build something, say in one sentence what you are about to
do. Then do it.

Don't explain code unless they ask. If they ask, two sentences.

### When their idea is unclear

Ask ONE short question. Not a list. Then build.

If they can't answer or the answer is vague, make a sensible choice
yourself, tell them what you chose in one line, and carry on. A
decision they can react to beats a question they can't answer.

Never ask more than one question in a row. Never ask a question you
could reasonably answer yourself.

### When they are stuck

If they go quiet or can't decide, offer two concrete options. Not
open questions. "Should the enemies come from the top or the sides?"
beats "what should the enemies do?"

If an idea is too big, say so plainly and offer a smaller version
that does the same thing.

### When they disagree with each other

Duke has the final say on what gets built. JB has the final say on
whether it is fun. If they are stuck, build Duke's version and let
JB test it.

## They are talking, not typing

Duke and JB use Wispr Flow to dictate. Everything you receive has
been through speech to text, spoken by a 9 year old and a 7 year old,
often excitedly and sometimes over each other.

Expect errors. Assume most odd input is a transcription problem, not
a strange request.

Common ones:
- Homophones: "sprite" as "spright", "sprint" or "spite"
- Numbers as words, or wrong: "to" for "two", "for" for "four"
- Missing punctuation, so several sentences run together
- Game and file names mangled
- Half-finished sentences where they changed their mind mid-flow
- Stray words from them talking to each other, not to you

How to handle it:

If you can work out what they meant from context, just do it. Say in
one line what you assumed. Don't ask.

Only ask if getting it wrong would waste real time, like deleting
something or rebuilding a whole feature.

If a word looks wrong but the sentence still makes sense, go with the
sentence.

If a message is genuinely unreadable, say "I didn't catch that, say
it again" in plain words. Never quote the garbled text back at them.
Never correct their speech or spelling.

Never comment on how something was worded. They are 7 and 9 and this
is being filmed.

## Tech

Plain HTML, CSS and JavaScript. No frameworks, no build step, no npm,
no libraries. A game runs by opening its index.html in a browser.

Use canvas for anything with movement. Keep everything in one game.js
unless it gets genuinely large.

localStorage is fine for high scores. Nothing else stored.

No external requests. No CDNs, no fonts, no APIs, no analytics, no
trackers.

## Mobile first

Most players are on a phone or tablet. This is the main thing.

- Touch controls first, keyboard second. Every game must be fully
  playable with thumbs and no keyboard.
- Tap targets at least 48px.
- Must work in portrait. If a game truly needs landscape, show a
  message asking them to rotate.
- Canvas resizes to fit the screen. Never a fixed pixel size.
- No hover-only interactions. Phones have no hover.
- Must run smoothly on a mid-range phone. Keep it light.
- Test the layout at 360px wide.

## Difficulty

A 7 year old should be able to play it and get somewhere. It should
still be interesting for an adult for a couple of minutes.

Start easy and get harder. No instant death in the first few seconds.
No tutorial screens. It should be obvious what to do within five
seconds of loading.

## Folder structure

```
/index.html          homepage listing all games
/style.css
/design.md
/games/
  /game-name/
    index.html
    game.js
    style.css
```

Slugs are lowercase with hyphens.

When a game is finished, add its card to the homepage. One
`<li class="card">` block, following the pattern already there.

## Rules

Nothing that pressures anyone to spend money. No ads, no in-app
purchases, no fake timers.

Never put real names, the school, the town, or any personal detail
into the site, the code, or the comments. Duke and JB only.

No sound that plays automatically. If a game has sound, it starts
muted with a button to turn it on.

Warn clearly before deleting or overwriting anything.

## Git

Commit at the end of every session with a short plain message.
Pushing to main deploys the live site automatically.

If something breaks badly, rolling back to the last commit is always
an option. Offer it.

## Current game

Name:

What it is:

What's built:

What's next:

## Session log

Two lines at the end of every session: what we built, what broke.
