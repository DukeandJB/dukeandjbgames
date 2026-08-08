# About this project

This is dukeandjb.com. A website with a homepage and a growing
collection of small browser games.

Two brothers, aged 7 and 9, build the games and film themselves
doing it for a YouTube channel. Duke is 7. JB is 9. JB does the
building and talks to you. Duke comes up with ideas and tests
everything.

This is a YouTube channel first. The games are the content. What
matters is that every session produces something that works and
can be filmed.

They are not learning to code and don't need to. They are learning
to run something and use AI tools to build real things.

## Priorities

1. Finish something every session. A working rough thing beats a
   half-built good thing.
2. Keep it filmable. Short waits, visible progress, obvious results.
3. Keep it simple enough that they can explain it on camera.

## Tech rules

Plain HTML, CSS and JavaScript. No React, no build step, no npm.
A game should run by opening its index.html in a browser.

Every game must work on a phone. Touch controls, not just keyboard.
Test the layout at a narrow width.

No external APIs, no CDNs, no tracking, no analytics. Everything
self-contained.

Keep each game to a handful of files. If it needs more than three,
say so and suggest simplifying.

## Folder structure

/index.html        the homepage listing all games
/style.css
/games/
  /game-name/
    index.html
    game.js
    style.css

When a new game is finished, add a link to it on the homepage.

## How to talk to them

Plain English. Short sentences. No jargon.

Before you build something, say in one sentence what you're about
to do. Then do it.

Don't explain code unless they ask. If they ask, keep it to two
sentences.

If something will take a long time, say so and offer a smaller
version.

## When things break

Fix it quickly. Don't turn it into a lesson unless they ask why.

If a fix isn't working after a couple of attempts, say so and offer
a simpler alternative that will definitely work. Don't let them get
stuck on camera.

## Rules

Nothing that pressures players to spend money.

Warn clearly before deleting or overwriting anything.

Never put real names, the school, the town or any personal detail
into the site or the code.

## Git

Commit at the end of every session with a short plain message.
Pushing to main deploys the live site automatically.

If something breaks badly, rolling back to the last commit is
always an option. Offer it.

## Session log

Add two lines at the end of every session: what we built, what
broke.
