# Audio reading and consistent highlighting standards

## Audio narration

The shared reader treats each semantic text block as a separate narration boundary.

- A page title or section heading is spoken separately from the paragraph below it.
- Each paragraph is segmented into sentences independently.
- Each list item is kept separate from the next item.
- Inline formatting, such as bold key terms, stays within the same spoken sentence.
- A heading without a full stop cannot merge with the paragraph below it.
- Sentence progress and the temporary narration highlight use the same text offsets.
- Reader controls, code samples and completion actions are excluded from narration.

The reader inserts block boundaries between headings, paragraphs, list items and quotations, then segments each block separately.

## Highlighting

The lesson renderer receives the selected lesson's full key-term list and emphasizes every matching occurrence in its detailed teaching sections. This replaces the previous narrow rule that bolded only a single opening definition when a paragraph matched one pattern.

- Key terms are emphasized consistently throughout the detailed reading.
- Emphasis uses semantic `strong` markup.
- Existing lesson explanations, cases, outcomes, quiz questions and answers are preserved.
- The temporary audio sentence highlight remains separate from permanent key-term emphasis.

## Scope

Only the Professional Computing lesson renderer and shared custom-lesson narration frame are changed. No quiz question, answer key, assessment setting, student record, payment, certificate, backend endpoint or environment variable is changed.
