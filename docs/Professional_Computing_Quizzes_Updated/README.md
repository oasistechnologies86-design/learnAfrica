# Professional Computing quizzes (updated)

These JSON files supersede the earlier export in `docs/Professional_Computing_Quizzes.zip`.

## Quiz structure
- 11 lesson quizzes, each with exactly 50 questions.
- Final examination, exactly 50 questions.
- Every quiz has 4 fill-in-the-blank questions, 31 multiple-choice questions, and 15 true/false questions.
- Existing questions were retained where possible. Eleven former fill-in-the-blank questions in each quiz were converted into multiple-choice questions so the total remains 50 while the fill-in section is reduced.
- The final exam was reduced from 100 to 50 questions by selecting a balanced subset from the existing question bank.

## Shuffling
Each quiz JSON has:
- `shuffle_questions: true`
- `shuffle_options: true`

These settings request question-order and multiple-choice-option shuffling in LearnAfrica. The importer and student quiz runtime must honor these settings for each attempt; verify this in the live student flow after importing.

## Import
Import each JSON file separately through the instructor quiz JSON import flow. The payload format remains `{ "quizzes": [ ... ] }`.

## Files
1. [01_An_Overview_of_Ethics.json](./01_An_Overview_of_Ethics.json)
2. [02_Ethics_for_IT_Workers_and_IT_Users.json](./02_Ethics_for_IT_Workers_and_IT_Users.json)
3. [03_Computer_and_Internet_Crime.json](./03_Computer_and_Internet_Crime.json)
4. [04_Privacy.json](./04_Privacy.json)
5. [05_Freedom_of_Expression.json](./05_Freedom_of_Expression.json)
6. [06_Intellectual_Property_and_Copyright.json](./06_Intellectual_Property_and_Copyright.json)
7. [07_Software_Development.json](./07_Software_Development.json)
8. [08_Impact_of_Information_Technology_on_Productivity_and_Quality_of_Life.json](./08_Impact_of_Information_Technology_on_Productivity_and_Quality_of_Life.json)
9. [09_Social_Networking.json](./09_Social_Networking.json)
10. [10_Ethics_of_IT_Organisations.json](./10_Ethics_of_IT_Organisations.json)
11. [11_Ghana_Data_Protection_Act_2012_Act_843.json](./11_Ghana_Data_Protection_Act_2012_Act_843.json)
12. [12_Final_Examination.json](./12_Final_Examination.json)


## Supported LearnAfrica question formats

The LearnAfrica quiz importer supports single choice (`single_choice`), multiple selection (`multiple_answer`), True/False (`true_false`), fill in the blank (`fill_blank`), and dropdown (`dropdown`). Dropdown example:

```json
{
  "type": "dropdown",
  "text": "Which city is the capital of Ghana?",
  "options": ["Accra", "Kumasi", "Tamale"],
  "correct_answer": 0
}
```

The correct-answer index is zero-based. Use at least two non-empty options. Multiple-selection questions instead use `correct_answers` with an array of at least two correct option indexes.
