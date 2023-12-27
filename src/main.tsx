import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import SeedPhraseGenerator from './seedgenerator';
import './index.css';

const exampleWordList: string[] = [
  "abandon",
  "ability",
  "able",
  "about",
  "above",
  "zoo"
];

ReactDOM.render(
  <React.StrictMode>
    <div>
      <App />
      <SeedPhraseGenerator wordList={exampleWordList} />
    </div>
  </React.StrictMode>,
  document.getElementById('root') as HTMLElement
);
