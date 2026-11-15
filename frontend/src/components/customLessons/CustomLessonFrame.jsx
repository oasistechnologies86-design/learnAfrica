import React from 'react';
import { Play, Pause, Square, RotateCcw, Volume2 } from 'lucide-react';

const EXCLUDED_READING_NODES = 'button, script, style, textarea, input, select, option, svg, pre, code, [aria-hidden="true"], .custom-lesson-reader-controls, .custom-lesson-completion, .custom-lesson-content-end';

function collectReadingSentences(root) {
  if (!root || typeof document === 'undefined') return { sentences: [], nodes: [] };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(EXCLUDED_READING_NODES)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let fullText = '';
  let current;
  while ((current = walker.nextNode())) {
    const value = current.nodeValue || '';
    if (!value) continue;
    nodes.push({ node: current, start: fullText.length, end: fullText.length + value.length });
    fullText += value;
  }
  let parts = [];
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
    parts = Array.from(segmenter.segment(fullText), item => ({
      text: item.segment.trim(), start: item.index, end: item.index + item.segment.length
    })).filter(item => item.text);
  } else {
    const expression = /[^.!?]+[.!?]+|[^.!?]+$/g;
    let match;
    while ((match = expression.exec(fullText))) {
      const text = match[0].trim();
      if (text) {
        const leading = match[0].indexOf(text);
        parts.push({ text, start: match.index + leading, end: match.index + leading + text.length });
      }
    }
  }
  return { sentences: parts, nodes };
}

function makeSentenceRange(sentence, nodes) {
  if (!sentence || !nodes.length) return null;
  const first = nodes.find(item => item.end > sentence.start);
  const last = [...nodes].reverse().find(item => item.start < sentence.end);
  if (!first || !last) return null;
  const range = document.createRange();
  range.setStart(first.node, Math.max(0, sentence.start - first.start));
  range.setEnd(last.node, Math.min(last.node.nodeValue.length, sentence.end - last.start));
  return range;
}

export default function CustomLessonFrame({
  lesson, children, mode = 'student', studentId, onComplete,
  isCompleted = false, isSaving = false, navigationOpen = false
}) {
  const readingRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const sentenceNodesRef = React.useRef([]);
  const sentencesRef = React.useRef([]);
  const sessionRef = React.useRef(0);
  const fallbackHighlightRef = React.useRef(null);
  const rateRef = React.useRef(1);
  const canComplete = mode === 'student' && typeof onComplete === 'function';
  const canRemember = mode === 'student' && Boolean(studentId) && Boolean(lesson?.id);
  const storageKey = canRemember ? `learnafrica:custom-reading:${studentId}:${lesson.id}` : null;
  const [showReadingCue, setShowReadingCue] = React.useState(true);
  const [sentences, setSentences] = React.useState([]);
  const [currentSentence, setCurrentSentence] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const [speechSupported, setSpeechSupported] = React.useState(false);
  const [savedPosition, setSavedPosition] = React.useState(false);
  const [readerStatus, setReaderStatus] = React.useState('Ready to read.');

  const getScrollContainer = () => {
    const article = readingRef.current;
    if (!article) return null;
    const main = article.closest('main');
    if (main && main.scrollHeight > main.clientHeight) return main;
    return document.scrollingElement || document.documentElement;
  };

  const advanceReading = () => {
    const container = getScrollContainer();
    if (!container) return;
    const isDocumentScroll = container === document.scrollingElement || container === document.documentElement;
    const currentTop = isDocumentScroll ? window.scrollY : container.scrollTop;
    const viewportHeight = container.clientHeight || window.innerHeight;
    const step = Math.min(420, Math.max(220, Math.round(viewportHeight * 0.48)));
    const nextTop = currentTop + step;
    if (isDocumentScroll) window.scrollTo({ top: nextTop, behavior: 'smooth' });
    else container.scrollTo({ top: nextTop, behavior: 'smooth' });
  };

  const clearSentenceHighlight = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.CSS?.highlights) {
      window.CSS.highlights.delete('custom-lesson-current-sentence');
    }
    if (fallbackHighlightRef.current) {
      fallbackHighlightRef.current.classList.remove('custom-lesson-reading-active');
      fallbackHighlightRef.current = null;
    }
  }, []);

  const highlightSentence = React.useCallback((index) => {
    clearSentenceHighlight();
    const sentence = sentencesRef.current[index];
    if (!sentence || typeof document === 'undefined') return;
    const range = makeSentenceRange(sentence, sentenceNodesRef.current);
    if (!range) return;
    if (typeof window !== 'undefined' && window.CSS?.highlights && typeof window.Highlight === 'function') {
      try {
        window.CSS.highlights.set('custom-lesson-current-sentence', new window.Highlight(range));
        return;
      } catch {
        // Fall back to highlighting the sentence's paragraph on older browsers.
      }
    }
    const element = range.startContainer.parentElement;
    const block = element?.closest('p, li, h1, h2, h3, h4, blockquote') || element;
    if (block) {
      block.classList.add('custom-lesson-reading-active');
      fallbackHighlightRef.current = block;
    }
  }, [clearSentenceHighlight]);

  const speakAt = React.useCallback((index, session) => {
    const sentence = sentencesRef.current[index];
    if (!sentence || typeof window === 'undefined' || !window.speechSynthesis) {
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }
    setCurrentSentence(index);
    highlightSentence(index);
    const utterance = new window.SpeechSynthesisUtterance(sentence.text);
    utterance.rate = rateRef.current;
    utterance.onstart = () => {
      if (session === sessionRef.current) setReaderStatus('Reading aloud now.');
    };
    utterance.onend = () => {
      if (session !== sessionRef.current) return;
      if (index + 1 < sentencesRef.current.length) speakAt(index + 1, session);
      else {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSentence(Math.max(0, sentencesRef.current.length - 1));
        setReaderStatus('Finished reading. Press Restart to listen again.');
      }
    };
    utterance.onerror = (event) => {
      if (session !== sessionRef.current || event.error === 'canceled' || event.error === 'interrupted') return;
      setIsPlaying(false);
      setIsPaused(false);
      setReaderStatus('Your device stopped the audio. Please check its text-to-speech voice settings and try again.');
    };
    try {
      // Speak immediately inside the Play tap. Some mobile browsers block speech
      // if it is delayed until after the tap has finished.
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlaying(false);
      setReaderStatus('Audio could not start. Please try Play again.');
    }
  }, [highlightSentence]);

  const playFrom = React.useCallback((index) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !sentencesRef.current.length) return;
    sessionRef.current += 1;
    const session = sessionRef.current;
    window.speechSynthesis.cancel();
    setIsPaused(false);
    setIsPlaying(true);
    setReaderStatus('Starting audio...');
    // Do not defer this call: mobile browsers may require the speech request
    // to happen directly from the user's tap.
    speakAt(Math.max(0, Math.min(index, sentencesRef.current.length - 1)), session);
  }, [speakAt]);

  const stopReading = React.useCallback(() => {
    sessionRef.current += 1;
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setReaderStatus('Reading stopped.');
  }, []);

  React.useEffect(() => {
    if (typeof document === 'undefined' || !window.CSS?.highlights) return undefined;
    const style = document.createElement('style');
    style.setAttribute('data-custom-lesson-highlight', 'true');
    style.textContent = `::highlight(custom-lesson-current-sentence) {
      background: color-mix(in oklab, var(--primary) 24%, transparent);
      color: inherit;
      text-decoration: underline;
      text-decoration-color: var(--primary);
      text-decoration-thickness: 2px;
      text-underline-offset: 3px;
    }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  React.useEffect(() => {
    const supported = typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && typeof window.SpeechSynthesisUtterance === 'function';
    setSpeechSupported(supported);
    const result = collectReadingSentences(contentRef.current);
    sentencesRef.current = result.sentences;
    sentenceNodesRef.current = result.nodes;
    setSentences(result.sentences);
    let saved = 0;
    if (storageKey) {
      try {
        const stored = Number(window.localStorage.getItem(storageKey));
        if (Number.isInteger(stored) && stored > 0) saved = Math.min(stored, Math.max(0, result.sentences.length - 1));
      } catch {
        // Reading remains available when browser storage is disabled.
      }
    }
    setCurrentSentence(saved);
    setSavedPosition(saved > 0);
    if (saved > 0) highlightSentence(saved);
    return () => {
      sessionRef.current += 1;
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      clearSentenceHighlight();
    };
  }, [lesson?.id, storageKey, clearSentenceHighlight, highlightSentence]);

  React.useEffect(() => {
    if (storageKey && sentences.length) {
      try {
        window.localStorage.setItem(storageKey, String(currentSentence));
      } catch {
        // Storage restrictions must not interrupt the lesson.
      }
    }
  }, [storageKey, sentences.length, currentSentence]);

  React.useEffect(() => {
    highlightSentence(currentSentence);
  }, [currentSentence, sentences, highlightSentence]);

  React.useEffect(() => {
    const container = getScrollContainer();
    if (!container) return undefined;
    const isDocumentScroll = container === document.scrollingElement || container === document.documentElement;
    const updateCueVisibility = () => {
      if (navigationOpen) {
        setShowReadingCue(false);
        return;
      }
      const currentTop = isDocumentScroll ? window.scrollY : container.scrollTop;
      const viewportHeight = container.clientHeight || window.innerHeight;
      const maxTop = Math.max(0, container.scrollHeight - viewportHeight);
      const remaining = maxTop - currentTop;
      setShowReadingCue(maxTop > 80 && remaining > Math.max(220, viewportHeight * 0.42));
    };
    updateCueVisibility();
    const target = isDocumentScroll ? window : container;
    target.addEventListener('scroll', updateCueVisibility, { passive: true });
    window.addEventListener('resize', updateCueVisibility);
    return () => {
      target.removeEventListener('scroll', updateCueVisibility);
      window.removeEventListener('resize', updateCueVisibility);
    };
  }, [navigationOpen, lesson?.id]);

  const handlePlay = () => {
    if (!speechSupported) {
      setReaderStatus('Audio reading is not available in this browser. Try opening LearnAfrica in Chrome.');
      return;
    }
    if (!sentencesRef.current.length) {
      setReaderStatus('No lesson text was found to read aloud.');
      return;
    }
    if (isPaused && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setReaderStatus('Resuming audio...');
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    playFrom(currentSentence);
  };
  const handlePause = () => {
    if (!isPlaying || !window.speechSynthesis) return;
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };
  const handleRestart = () => {
    setCurrentSentence(0);
    setSavedPosition(false);
    playFrom(0);
  };
  const handleSeek = (event) => {
    const next = Number(event.target.value);
    setCurrentSentence(next);
    setSavedPosition(false);
    if (isPlaying) playFrom(next);
  };
  const handleRateChange = (event) => {
    const nextRate = Number(event.target.value);
    rateRef.current = nextRate;
    setRate(nextRate);
    if (isPlaying) playFrom(currentSentence);
  };

  const heroTitle = lesson?.title || 'Explore, understand and apply what you learn.';

  return (
    <div className="custom-lesson-page" data-custom-lesson-mode={mode}>
      <section className="custom-lesson-hero" aria-label="Lesson introduction">
        <img className="custom-lesson-hero-photo" src="https://images.pexels.com/photos/5965650/pexels-photo-5965650.jpeg?auto=compress&cs=tinysrgb&w=2000"
          alt="A student studying outdoors on a laptop with a notebook beside her" loading="eager" />
        <div className="custom-lesson-hero-copy"><h1>{heroTitle}</h1></div>
      </section>
      <section className="custom-lesson-reader-controls" aria-label="Read lesson aloud">
        <div className="custom-lesson-reader-heading">
          <span><Volume2 aria-hidden="true" /> Listen to this lesson</span>
          {savedPosition && mode === 'student' && <small>Your last reading position is saved on this device.</small>}
        </div>
        {speechSupported ? (
          <>
            <div className={`custom-lesson-reader-status ${isPlaying ? 'is-active' : ''} ${readerStatus === 'Starting audio...' ? 'is-starting' : ''}`} role="status" aria-live="polite">
              <span className="custom-lesson-reader-indicator" aria-hidden="true"><i /><i /><i /><i /></span>
              <span>{readerStatus}</span>
            </div>
            <div className="custom-lesson-reader-actions">
              <button type="button" onClick={handlePlay} disabled={!sentences.length} aria-label={isPaused ? 'Resume reading' : 'Play reading'}>
                <Play aria-hidden="true" /> {isPaused ? 'Resume' : 'Play'}
              </button>
              <button type="button" onClick={handlePause} disabled={!isPlaying} aria-label="Pause reading">
                <Pause aria-hidden="true" /> Pause
              </button>
              <button type="button" onClick={stopReading} disabled={!isPlaying && !isPaused} aria-label="Stop reading">
                <Square aria-hidden="true" /> Stop
              </button>
              <button type="button" onClick={handleRestart} disabled={!sentences.length} aria-label="Restart reading from the beginning">
                <RotateCcw aria-hidden="true" /> Restart
              </button>
              <label className="custom-lesson-reader-speed">
                <span>Speed</span>
                <select value={rate} onChange={handleRateChange} aria-label="Reading speed">
                  <option value="0.8">Slow</option>
                  <option value="1">Normal</option>
                  <option value="1.2">Fast</option>
                </select>
              </label>
            </div>
            <div className="custom-lesson-reader-timeline">
              <span>Reading progress</span>
              <input type="range" min="0" max={Math.max(0, sentences.length - 1)} step="1"
                value={Math.min(currentSentence, Math.max(0, sentences.length - 1))}
                onChange={handleSeek} disabled={!sentences.length}
                aria-label="Move to a sentence in the lesson" />
              <small>{sentences.length ? `Sentence ${Math.min(currentSentence + 1, sentences.length)} of ${sentences.length}` : 'No reading text found'}</small>
            </div>
            <p className="custom-lesson-reader-note">The highlighted sentence follows the narration. Move the progress bar to jump to another sentence.</p>
          </>
        ) : (
          <p className="custom-lesson-reader-note">Audio reading is not supported by this browser. You can still read the lesson normally.</p>
        )}
      </section>
      <article ref={readingRef} className="custom-lesson-system" aria-label={lesson?.title || 'Custom lesson'}>
        <div ref={contentRef} className="custom-lesson-reading-content">{children}</div>
        {canComplete && (
          <section className="custom-lesson-completion" aria-label="Complete this lesson">
            <p>You've reached the end of this lesson. Click below to mark it as complete and continue to your next lesson.</p>
            {isCompleted ? (
              <button type="button" className="is-completed" disabled aria-label="Lesson completed">FINISHED <span aria-hidden="true">✓</span></button>
            ) : (
              <button type="button" onClick={onComplete} disabled={isSaving}>{isSaving ? 'SAVING...' : 'MARK AS COMPLETE'}</button>
            )}
          </section>
        )}
        <div className="custom-lesson-content-end" aria-hidden="true" />
      </article>
      {!navigationOpen && showReadingCue && (
        <div className="custom-lesson-sticky-action">
          <button type="button" onClick={advanceReading} aria-label="Continue reading by scrolling down">
            <span className="custom-lesson-scroll-label">Keep reading <span aria-hidden="true">·</span> Completion is at the end</span>
            <span className="custom-lesson-scroll-arrow" aria-hidden="true">↓</span>
          </button>
        </div>
      )}
    </div>
  );
}
