"""Regression tests for batched course curriculum loading."""
import sqlite3

from app.models import get_course_sections


class CountingDatabase:
    def __init__(self, connection):
        self.connection = connection
        self.query_count = 0

    def execute(self, sql, params=()):
        self.query_count += 1
        return self.connection.execute(sql, params)


def make_database():
    connection = sqlite3.connect(":memory:")
    connection.row_factory = sqlite3.Row
    connection.executescript(
        '''
        CREATE TABLE curriculum_sections (
            id INTEGER PRIMARY KEY,
            course_id TEXT NOT NULL,
            title TEXT NOT NULL,
            "order" INTEGER NOT NULL
        );
        CREATE TABLE lessons (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            video_url TEXT,
            is_final INTEGER DEFAULT 0
        );
        CREATE TABLE section_lessons (
            section_id INTEGER NOT NULL,
            lesson_id INTEGER NOT NULL,
            "order" INTEGER NOT NULL
        );
        CREATE TABLE lesson_resources (
            id INTEGER PRIMARY KEY,
            lesson_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL
        );

        INSERT INTO curriculum_sections VALUES
            (10, 'course-1', 'First section', 1),
            (20, 'course-1', 'Second section', 2);
        INSERT INTO lessons VALUES
            (101, 'Lesson one', 'https://cdn.example/one.mp4', 0),
            (102, 'Final lesson', NULL, 1);
        INSERT INTO section_lessons VALUES
            (10, 101, 1),
            (20, 102, 1);
        INSERT INTO lesson_resources VALUES
            (1001, 101, 'Slides', 'https://cdn.example/slides.pdf'),
            (1002, 102, 'Notes', 'https://cdn.example/notes.pdf');
        '''
    )
    return connection


def test_course_sections_preserve_structure_and_batch_queries():
    db = CountingDatabase(make_database())

    sections, all_lessons = get_course_sections(db, "course-1", False)

    assert [section["title"] for section in sections] == [
        "First section",
        "Second section",
    ]
    assert [[lesson["id"] for lesson in section["lessons"]] for section in sections] == [
        [101],
        [102],
    ]
    assert [lesson["id"] for lesson in all_lessons] == [101, 102]

    first, final = all_lessons
    assert first["videoUrl"] == "https://cdn.example/one.mp4"
    assert first["isCompleted"] is False
    assert first["is_completed"] is False
    assert first["is_final"] is False
    assert first["resources"] == [{
        "id": 1001,
        "lesson_id": 101,
        "title": "Slides",
        "url": "https://cdn.example/slides.pdf",
    }]
    assert final["videoUrl"] == ""
    assert final["is_final"] is True
    assert final["resources"][0]["id"] == 1002

    # One section query, one lesson query, and one resource query.
    assert db.query_count == 3


def test_course_without_sections_returns_empty_curriculum():
    connection = make_database()
    db = CountingDatabase(connection)

    sections, all_lessons = get_course_sections(db, "course-without-sections", False)

    assert sections == []
    assert all_lessons == []
    assert db.query_count == 1


if __name__ == "__main__":
    test_course_sections_preserve_structure_and_batch_queries()
    test_course_without_sections_returns_empty_curriculum()
    print("ALL COURSE SECTION QUERY CHECKS PASSED")
