# 🛩️ Sky Racer - Arcade Flying Game

A simple and fun arcade-style flying game built with vanilla JavaScript, HTML5 Canvas, and CSS. Navigate your plane through treacherous mountain ranges, avoid obstacles, and rack up the highest score!

## 🎮 Play the Game

[Click here to play Sky Racer!](#) *(will be available once hosted on GitHub Pages)*

## ✨ Features

- **Simple Controls**: Easy to learn, hard to master
- **Smooth Animations**: Fluid gameplay with canvas-based rendering
- **Score Tracking**: Local high score saved in browser
- **Responsive Design**: Works on desktop and mobile devices
- **Beautiful Graphics**: Hand-drawn plane and mountain obstacles
- **Progressive Difficulty**: Game gets faster as you score more points

## 🎯 How to Play

### Controls

- **⬆️ Arrow Up**: Move plane upward
- **⬇️ Arrow Down**: Move plane downward
- **SPACE**: Start game / Pause / Resume

### Objective

- Navigate your red plane through the gaps between mountains
- Avoid crashing into the top or bottom obstacles
- Survive as long as possible to achieve the highest score
- Each obstacle you pass increases your score by 1
- Beat your high score!

## 🚀 Installation & Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/yourrepo.git
   cd yourrepo
   ```

2. **Open the game**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Python 3
     python -m http.server 8000

     # Python 2
     python -m SimpleHTTPServer 8000

     # Node.js (with http-server)
     npx http-server
     ```
   - Navigate to `http://localhost:8000` in your browser

## 🌐 Hosting on GitHub Pages

1. **Enable GitHub Pages**
   - Go to your repository settings
   - Scroll to "Pages" section
   - Under "Source", select the branch you want to deploy (usually `main` or `master`)
   - Click "Save"

2. **Access your game**
   - After a few minutes, your game will be available at:
   - `https://yourusername.github.io/yourrepo/`

## 📁 Project Structure

```
.
├── index.html      # Main HTML file
├── styles.css      # Game styling
├── game.js         # Game logic and mechanics
└── README.md       # This file
```

## 🎨 Game Mechanics

### Physics
- Gravity constantly pulls the plane downward
- Arrow keys provide upward/downward thrust
- Maximum speed limits prevent uncontrollable movement

### Obstacles
- Mountain ranges spawn at random intervals
- Gap size varies for increased difficulty
- Each mountain has a snow-capped peak
- Obstacles scroll from right to left

### Scoring
- Pass through gaps to earn points
- Golden stars appear when you score
- High score persists using localStorage

## 🛠️ Technologies Used

- **HTML5 Canvas**: For rendering game graphics
- **Vanilla JavaScript**: Game logic and physics
- **CSS3**: Styling and responsive design
- **LocalStorage API**: High score persistence

## 🎓 Learning Resources

This game demonstrates several programming concepts:
- Canvas API and 2D rendering
- Game loop and animation frames
- Collision detection
- Object-oriented design
- Event handling
- State management

## 🤝 Contributing

Feel free to fork this project and add your own features! Some ideas:
- Add sound effects
- Implement different plane skins
- Add power-ups (shields, slow-motion, etc.)
- Create different difficulty levels
- Add mobile touch controls
- Implement online leaderboards

## 📜 License

This project is open source and available under the MIT License.

## 🎉 Enjoy!

Have fun playing Sky Racer! Try to beat your high score and challenge your friends!

---

Made with ❤️ using vanilla JavaScript
