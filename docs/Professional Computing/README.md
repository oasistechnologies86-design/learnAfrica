# Professional Computing

Maintained documentation and assessment pack for the LearnAfrica Professional Computing course.

## Current files

- **Custom Pages/ProfessionalComputingLesson.jsx** — current 11-lesson custom-page content and renderer, keyed from `professional-computing-01` through `professional-computing-11`.
- **Custom Pages/CustomLessonFrame.jsx** — shared reading and audio narration frame. Headings, paragraphs and list items are separate narration blocks.
- **Quizzes/** — 11 topic quiz JSON files and the cumulative final examination.
- **Assessment Inventory.md** — verified question counts and types for every quiz.
- **Audio and Highlighting Standards.md** — narration and emphasis behaviour.
- **Quiz Coverage Audit.md** — previous question-to-lesson teaching coverage map.
- **Historical Setup Notes.md** — previous setup notes. Some quiz-format statements are outdated; use the verified inventory below.

## Verified assessment format

All 12 JSON files were validated in the previous quiz-pack inspection. Each contains exactly 50 questions, for 600 questions total. Every file contains 31 multiple-choice, 15 true/false and 4 fill-in-the-blank questions. This supersedes older notes that state 20/15/15.

## Important boundaries

The source snapshots here are documentation copies. The live application continues to load the implementation from `frontend/src/components/customLessons/`. Do not import these documentation copies as a second runtime source. The quiz JSON files are assessment-pack documentation; merely placing them here does not import them into production.

This reorganisation and narration/highlighting update do not alter student records, quiz settings, payment data, certificates, backend services or environment variables.
