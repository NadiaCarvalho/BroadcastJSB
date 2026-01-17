# 📻 Broadcast JSB: Latent Manifold Receiver

**Broadcast JSB** is an interactive audio-visual installation that explores the "latent space" of Johann Sebastian Bach’s chorales. By treating a neural-network-derived chord dictionary as a radio landscape, users can "tune" between traditional Baroque harmony and mathematical abstractions.



---

## 🧪 The Concept

The application loads the 371 Bach chorales and maps every unique chord into a multi-dimensional latent space. As the "Broadcaster" plays a chorale, the user can turn the **Tuning Dial** to introduce "drift."

* **At 0% Tuning:** You hear the pure, intended harmony of Bach.
* **At 50% Tuning:** The system substitutes original chords with their closest neighbors in the latent manifold.
* **At 100% Tuning:** The harmony dissolves into the "interstation noise" of the latent space.

---

## 🛠 Technical Architecture

The project is built with a modern web stack optimized for high-performance audio and spatial calculations:

* **Frontend:** [Vue 3](https://vuejs.org/) (Composition API) for a reactive, state-driven interface.
* **Audio Engine:** [Tone.js](https://tonejs.github.io/) for WebAudio scheduling and additive synthesis.
* **Spatial Search:** [`kd-tree-javascript`](https://github.com/ubilabs/kd-tree-javascript) to perform $O(\log N)$ nearest-neighbor lookups across thousands of chord vectors in real-time.
* **Data Processing:** [Python (Music21) scripts](https://github.com/NadiaCarvalho/BroadcastJSB/blob/main/Create_Database.ipynb) were used to encode the Bach corpus into the JSON dictionary.

---

## 🕹 Features

### 📡 Decoder Strategies
The **Certified JSB Decoder** unit allows you to switch how the "drift" is calculated in real-time:
* **NEAR (KNN):** Randomly samples from the $K$ nearest neighbors for a shimmering, unstable effect.
* **MIDPOINT (Linear):** Calculates a mathematical path between the previous and next chord, ignoring the original.
* **VECTOR (Angular):** Attempts to follow the "direction" of the voice-leading through the latent manifold.

### 🎚 Analog Interface
* **Frequency Window:** A physical needle tracks your position in the latent spectrum.
* **Certified JSB Seal:** A flickering portrait of Bach that reacts to signal interference when scanning for new "stations."
* **VU Meter:** Real-time post-fader output visualization with analog needle physics.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* NPM or Yarn

### Installation
1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/broadcast-jsb.git](https://github.com/your-username/broadcast-jsb.git)
    cd broadcast-jsb
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

## 📂 Project Structure

```text
├── src
│   ├── assets/          # Static images (Bach portrait, textures)
│   ├── components/      # UI Units (Dials, Meters, Switches, Chooser)
│   ├── data/            # Latent chord dictionary and Chorale sequences
│   ├── logic/
│   │   ├── Broadcaster.js   # The "Brain" - manages state and timing
│   │   ├── audioPlayback.js # Tone.js synth and signal chain
│   │   ├── latentStrategies.js # K-D Tree lookups
│   │   └── distance.js      # Vector math (Euclidean, Angular)
│   └── App.vue          # Main layout and assembly
```

---

## 📜 Credits & Data

* Musical Data: Based on the 371 Bach Chorales provided by the Music21 corpus.

* Portrait: Johann Sebastian Bach by Elias Gottlob Haussmann (1746).

* Design: Inspired by mid-century Braun and Telefunken radio receivers.
