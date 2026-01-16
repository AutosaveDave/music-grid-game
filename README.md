# Tonnetz Music Grid Game

A 3D browser-based game that lets you explore musical harmony through the neo-Riemannian Tonnetz.

## Play Now

[Play the game](https://yourusername.github.io/music-grid-game/)

## About

Move your sphere across a triangular grid based on the **neo-Riemannian Tonnetz** - a geometric representation of tonal space used in music theory. Each triangle represents a chord:

- **Teal triangles (pointing up)** = Major triads
- **Purple triangles (pointing down)** = Minor triads

As you move, the game plays the chord for the triangle you're currently in using Web Audio synthesis.

## Controls

- **W** - Move forward
- **A** - Move left
- **S** - Move backward
- **D** - Move right

## Features

- 3D graphics powered by Three.js
- Real-time MIDI-style chord synthesis via Web Audio API
- Neo-Riemannian Tonnetz grid visualization
- Smooth camera following
- Visual feedback showing current chord

## The Tonnetz

The Tonnetz (German for "tone network") is a lattice diagram representing tonal space. In this implementation:

- Moving horizontally = Perfect fifth intervals (+7 semitones)
- Moving vertically = Major third intervals (+4 semitones)
- Adjacent triangles share two notes, creating smooth harmonic progressions

## Local Development

Simply open `index.html` in a modern web browser. No build step required!

## Technologies

- Three.js for 3D rendering
- Web Audio API for sound synthesis
- Vanilla JavaScript (no frameworks)

## License

MIT
