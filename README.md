# Mirifer - Learn German

A sentence-based language learning application that teaches German through practical scenarios and voice interaction.

## Features

### ✨ Core Features
- **100 Levels**: Progressive difficulty from beginner to advanced
- **Scenario-Based Learning**: 5 practical scenarios per level
- **5 Sentences per Scenario**: Focused, bite-sized learning
- **Word-by-Word Meanings**: Understand each word in context
- **Text-to-Speech**: Listen to slow, clear pronunciation
- **Speech Recognition**: Record and verify your pronunciation
- **Progress Tracking**: Visual checkmarks for completed sentences

### 📚 Level 1 Scenarios
1. **Greeting** - Basic greetings and hellos
2. **Introduce Yourself** - Personal introductions
3. **Asking Address** - Location and direction questions
4. **Order Food** - Restaurant ordering basics
5. **Ask for Check** - Payment and checkout phrases

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Edge, Firefox, Safari)
- Microphone access for speech recognition
- Internet connection (optional, for AI integration)

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Allow microphone permissions when prompted

### Usage

1. **Listen**: Click the play button (▶) to hear the sentence pronounced slowly
2. **Learn**: Read the word meanings below each sentence
3. **Practice**: Click "Record Your Voice" and speak the sentence
4. **Progress**: Get a checkmark when you pronounce correctly
5. **Continue**: Move to the next sentence automatically

## File Structure

```
Mirifer/
├── index.html          # Main HTML structure
├── styles.css          # Styling and layout
├── app.js             # Core application logic
├── ai-integration.js  # AI sentence generation (Llama 3.2)
└── README.md          # This file
```

## Future Integration: AI Sentence Generation

The app is designed to integrate with Llama 3.2:1b for dynamic sentence generation across all 100 levels.

### Planned AI Features
- Generate contextual sentences for each scenario
- Adjust difficulty based on level (1-100)
- Create word-by-word translations
- Ensure sentence length constraints per level

## Technical Details

### Technologies Used
- **HTML5**: Structure and semantic markup
- **CSS3**: Responsive design and animations
- **Vanilla JavaScript**: Core functionality
- **Web Speech API**: Text-to-Speech and Speech Recognition
- **Local Storage**: Progress persistence (planned)

### Browser Compatibility
- ✅ Chrome/Edge (Best support for speech features)
- ✅ Firefox (Limited speech recognition)
- ✅ Safari (macOS/iOS with limitations)

## Customization

### Adding New Levels
Edit `app.js` and add level data following this structure:

```javascript
{
    level: 2,
    scenarios: [
        {
            id: 1,
            name: "Scenario Name",
            description: "Description",
            sentences: [
                {
                    text: "Sentence text",
                    words: [
                        { word: "Word", meaning: "Meaning" }
                    ],
                    completed: false
                }
            ]
        }
    ]
}
```

### Adjusting Difficulty
- **Level 1**: Max 4 words per sentence
- **Level 2-10**: Max 6 words per sentence (recommended)
- **Level 11-50**: Max 8-10 words
- **Level 51-100**: No word limit, complex grammar

## Contributing

Contributions are welcome! Areas for improvement:
- Additional language support
- More scenarios per level
- Better speech recognition accuracy
- Offline mode support
- User accounts and cloud sync

## License

This project is open source and available for educational purposes.

## Contact

For questions or suggestions, please open an issue in the repository.

---

**Happy Learning! 🌍📚**
