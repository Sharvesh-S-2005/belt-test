Karate Belt Grading System — Complete Project Specification

Project Overview

A web-based karate belt grading management system that allows 10 masters to collaboratively add students and record marks during a belt grading test. The system supports real-time concurrent access, structured mark entry by kyu level, and automatic result computation with ranking.

Tech Stack

Frontend: React (Vite)
Backend: Node.js with Express
Database: PostgreSQL
Authentication: Session-based (hardcoded credentials)

User Accounts

There are exactly 10 users. All credentials are hardcoded in the backend. The usernames are master1 through master10, each with the same default password: karate@2024

Authentication Flow

The login page is the entry point of the application. It has a minimal form with username and password fields. On successful login, the user is redirected to the home page. The session persists until the user explicitly logs out or closes the browser. All 10 masters have identical permissions.

Home Page

After login, the home page displays exactly two options as large clickable cards or buttons:

Option 1: Add Students to Belt Test
Option 2: Grade the Students

There is also a logout option accessible from this page.

Feature 1 — Add Students to Belt Test

This page is used before the grading test to register students.

The form contains five fields:

Name — text input, mandatory
Age — numeric input, mandatory
Phone Number — text input, mandatory
Class — text input, optional
Test Grade — dropdown, mandatory, with 8 options: Kyu 1, Kyu 2, Kyu 3, Kyu 4, Kyu 5, Kyu 6, Kyu 7, Kyu 8

Layout and Interactions:

On the right side of the form, there is a Save button that saves the current student's data to the database.
Below the Save button, there is an Add Another Student button that clears all fields and allows entering a new student record. This button only appears after at least one successful save.
On the left side, there is an Exit button that navigates the user back to the home page without saving any unsaved data.

Validation:

Name, Age, Phone Number, and Test Grade are mandatory. The form must not submit if any mandatory field is empty. Inline validation messages should appear on empty mandatory fields when Save is clicked.

Concurrency:

All 10 masters can simultaneously add students from their own devices. Each save immediately writes to the PostgreSQL database. No locking or conflict handling is needed for this page since each student record is independent.

Feature 2 — Grade the Students

This page is used on the actual grading day and is split into two sub-views.

Sub-view A — Kyu Selection Page (Grade Home)

When a master navigates to Grade the Students, they see a grid of 8 boxes, one for each Kyu (Kyu 1 through Kyu 8).

Locking Rule: If one master opens a specific Kyu (example: Kyu 3), that Kyu becomes locked and no other master can open it simultaneously. The other 7 Kyus remain available. The locked Kyu box must visually indicate that it is in use (example: greyed out or labeled as "In Use"). When the master who opened it exits back to this page, the lock is released and the Kyu becomes available again.

Locking must be implemented in the backend using a database table that records which Kyu is locked by which session. On exit or session disconnect, the lock is released.

Sub-view B — Mark Entry Sheet (inside a specific Kyu)

When a master opens a Kyu, they see a table with the following structure:

The students in this Kyu are displayed in ascending order of age (youngest first).
If two students have the same age, their relative order is not strictly defined (any consistent order is acceptable).

The table has 5 columns:

Column 1: S.No — auto-generated serial number starting from 1, read-only
Column 2: Name — pulled from student records, read-only
Column 3: Ex/Basics/Comb — editable numeric input, max marks 40
Column 4: Kata — editable numeric input, max marks 40
Column 5: Others — editable numeric input, max marks 20

Each of columns 3, 4, and 5 has its own independent Save button at the top or bottom of that column. This is because different masters may be responsible for grading different columns. A column is considered saved only when its Save button has been explicitly clicked.

At the bottom of the page, there is a Result button. This button is disabled if any of columns 3, 4, or 5 have unsaved changes or have not been saved at all for the entire Kyu. The Result button is enabled only when all three columns have been saved for every student in that Kyu.

There is also an Exit button on this page. Clicking Exit releases the Kyu lock and navigates the master back to the Kyu Selection Page (Sub-view A).

Sub-view C — Result Sheet (after clicking Result)

Clicking the Result button opens a new view (or modal) showing the computed results for that Kyu.

The result sheet has 4 columns:

S.No — a new serial number in the result list
Name — student name
Total — sum of columns 3, 4, and 5 (max 100)
Rank — computed based on total marks, starting from rank 1

Ranking Rules:

Students are ranked from highest total to lowest. Rank starts at 1.
If multiple students have the same total, they receive the same rank.
Among students with the same rank (same total), they are ordered by their original S.No in ascending order (the student with the smaller original S.No appears first).
The result list is displayed in rank order from rank 1 downward.

Example: If students with S.No 6, 10, and 2 all have the same total, they all get the same rank, but they appear in the result as S.No 2 first, then 6, then 10.

This same result logic applies independently to all 8 Kyus.

Database Schema

Table: users
Columns: id (serial primary key), username (varchar unique), password (varchar)
Seeded with 10 rows at startup.

Table: students
Columns: id (serial primary key), name (varchar not null), age (integer not null), phone (varchar not null), class (varchar), test_grade (varchar not null, values 'Kyu 1' through 'Kyu 8'), created_at (timestamp default now())

Table: marks
Columns: id (serial primary key), student_id (integer references students), ex_basics_comb (integer), kata (integer), others (integer), ex_saved (boolean default false), kata_saved (boolean default false), others_saved (boolean default false), updated_at (timestamp default now())
One row per student, created when the student is added or when the Kyu is first opened.

Table: kyu_locks
Columns: id (serial primary key), kyu (varchar unique), locked_by (varchar), locked_at (timestamp default now())
A row exists in this table only when that Kyu is currently locked. The row is deleted when the lock is released.

Design Specification

Color Palette:
Primary background: White (
#FFFFFF)
Accent / interactive elements: Sky blue (
#87CEEB or close variant such as 
#5BAFD6)
Buttons (Exit, Result, Add, Save): Sky blue background with white text
Input boxes and cards: Light sky blue border or background tint
Text: Dark gray or near-black for readability

Style Rules:
Minimalistic and professional
No gradients, no shadows, no decorative illustrations
Clean sans-serif font (Inter or system default)
Cards for Kyu selection must be uniform in size and layout
Table in the mark entry sheet must have clear borders and alternating row shading (white and very light blue) for readability
Responsive layout is not strictly required but the pages must render cleanly on a standard 1280px wide desktop screen

Development Phases

Phase 1 — Project Setup and Authentication
Initialize the project repository with separate frontend and backend folders.
Set up PostgreSQL connection and run the schema migrations to create all four tables.
Seed the database with the 10 master user accounts.
Build the login page with hardcoded credential validation against the database.
Set up session management on the backend.
Implement a protected home page that shows the two main options only when logged in.

Phase 2 — Add Students Feature
Build the Add Students to Belt Test page with all five fields.
Implement client-side validation for mandatory fields.
Connect the Save button to the backend API endpoint that inserts a student record into the students table.
Implement the Add Another Student button behavior.
Implement the Exit button behavior.
Test concurrent inserts from multiple sessions.

Phase 3 — Grade Students — Kyu Selection and Locking
Build the Kyu Selection Page showing 8 Kyu boxes.
Implement the backend API for acquiring and releasing Kyu locks using the kyu_locks table.
Display visual lock status on the Kyu boxes in real time (poll every 3–5 seconds or use WebSocket).
Prevent a second master from opening an already-locked Kyu.
Release the lock when the master clicks Exit on the mark entry sheet.
Handle session disconnection by releasing the lock (either via heartbeat or cleanup job).

Phase 4 — Grade Students — Mark Entry and Saving
Build the mark entry table for a selected Kyu.
Load students for the selected Kyu ordered by age ascending.
Implement independent Save buttons for each of columns 3, 4, and 5.
Save the respective column's marks and set the corresponding saved flag in the marks table.
Implement the Result button enable/disable logic based on whether all three columns are saved for all students in the Kyu.

Phase 5 — Result Computation and Final Polish
Build the Result Sheet view that opens when the Result button is clicked.
Compute totals and ranks on the backend.
Apply the tie-breaking rule: same rank for same total, ordered by original S.No ascending among ties.
Display the result in a clean 4-column table.
Apply the full design system (white and sky blue) consistently across all pages.
End-to-end testing of the complete flow from login to result.

API Endpoints Summary

POST /api/auth/login — authenticate and create session
POST /api/auth/logout — destroy session
GET /api/students — get all students (optionally filtered by test_grade)
POST /api/students — add a new student
GET /api/kyu-locks — get current lock status of all 8 Kyus
POST /api/kyu-locks/:kyu — acquire lock on a Kyu
DELETE /api/kyu-locks/:kyu — release lock on a Kyu
GET /api/marks/:kyu — get marks for all students in a Kyu
POST /api/marks/save-column — save marks for one column (column name and values passed in body)
GET /api/results/:kyu — compute and return ranked results for a Kyu