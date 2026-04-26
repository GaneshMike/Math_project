# Math Workout 🧠⚡

A highly interactive, gamified mental math application designed to train quick calculation skills under pressure. Built with a sleek, video-game-inspired UI/UX, this project features fluid animations, step-by-step review systems, and multiple training modes to challenge your cognitive limits.

## 🚀 Game Modes

### 1. The Brain Cruncher
A high-stakes, multi-step chain calculation challenge. 
* **How it works:** You are given a starting number, followed by a rapid sequence of mathematical operations (e.g., `Add 7`, `Multiply by 2`, `Divide by 3`). You must keep a running total in your head and enter the final answer.
* **Solution Review:** After every attempt, a detailed, step-by-step breakdown of the solution is displayed so you can see exactly where you went wrong (or right!).
* **Difficulties:**
  * **Low Pressure:** 10 chain operations per question.
  * **Medium Pressure:** 20 chain operations per question.
  * **High Pressure:** 50 chain operations per question.

### 2. Times Table
Master your multiplication tables with dedicated focus.
* Choose any table from **2x to 12x** and practice solving random factors in a rapid-fire format.

### 3. Mental Math Master
Classic arithmetic training with audio support.
* **How it works:** Questions are read aloud via audio cues. You must process the numbers audibly and use the on-screen keypad to submit your answers quickly.

## ✨ Key Features
* **Modern UI/UX:** Clean aesthetics, glass-morphism elements, CSS-driven micro-animations, and a highly responsive on-screen numeric keypad.
* **Dynamic Modularity:** Clean, modular backend structure built on Flask, separating generator logic (math engines) from application routes.
* **Global Settings:** Customize the number of questions per session (5, 10, or 20) and track your total correct/incorrect stats and time penalties.

## 🛠️ Technology Stack
* **Backend:** Python 3.13, Flask (Blueprints for modular routing)
* **Frontend:** Vanilla JavaScript (ES6+), HTML5, custom CSS3 (no external UI libraries)
* **Environment:** Managed via standard Python virtual environments (`venv`)

## 💻 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GaneshMike/Math_project.git
   cd Math_project
   ```

2. **Activate the virtual environment:**
   ```bash
   source math_env/bin/activate
   ```

3. **Install dependencies:**
   *(If not already installed in the environment)*
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask application:**
   ```bash
   python app.py
   ```

5. **Play:**
   Open your browser and navigate to `http://127.0.0.1:5000`
