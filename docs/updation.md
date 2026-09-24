### Detailed Requirement Changes

#### 1. Changes in "Add Students to Belt Test" Page

- **1.1 Field Replacement & Validation:**
  - **Remove** the `Phone Number` field from the registration form and database.
  - **Add** a new mandatory numeric input field called **`Others Marks`** in place of Phone Number.
  - **Validation:** Must be a mandatory integer input with a range of `0` to `20` max.
  - **Data Persistence:** When saving a student, this mark must be saved directly into the database so it is automatically pre-filled/inbuilt for the grading phase.

- **1.2 Test Grade Dropdown Rearrangement:**
  - **Remove** `Kyu 8`.
  - **Rearrange** the dropdown options in descending order from **Kyu 7 down to Kyu 1** (i.e., Kyu 7, Kyu 6, Kyu 5, Kyu 4, Kyu 3, Kyu 2, Kyu 1).

---

#### 2. Changes in "Grade Students" Page

- **2.1 Kyu Selection Grid (Sub-view A):**
  - **Remove** the `Kyu 8` box entirely from the grid.
  - **Rearrange** the grid display order from **Kyu 7 to Kyu 1**.

- **2.2 Mark Entry Sheet (Sub-view B):**
  - The table columns for entering marks need to be updated:
    - **Column 3 (Ex/Basics/Comb):** Editable numeric input (max 40) + independent Save button.
    - **Column 4 (Kata):** Editable numeric input (max 40) + independent Save button.
    - **Column 5 (Others):** Read-only / Inbuilt display showing the `Others Marks` value entered during student registration (max 20).
  - Since `Others` is now collected during registration, it is treated as auto-saved (`others_saved = true`).
  - **Result Button Enable Rule:** The Result button should enable as soon as both `Ex/Basics/Comb` and `Kata` columns have been explicitly saved for all students in that Kyu.

- **2.3 Updated Result & Ranking Tie-Breaker Logic (Sub-view C):**
  - Update the backend/frontend logic for calculating total scores and ranks:
    1. **Primary Sort:** Compare `Total Marks` (sum of Ex/Basics/Comb + Kata + Others, max 100) descending.
    2. **Tie-Breaker 1:** If Totals are equal, compare **`Kata`** column marks descending.
    3. **Tie-Breaker 2:** If Kata marks are also equal, compare **`Ex/Basics/Comb`** column marks descending.
    4. **Tie-Breaker 3:** If still tied, preserve order by original `S.No` ascending.
  - **Rank Display Format:** Assign standard dense ranking positions (e.g., if two students tie for rank 1, they both receive rank `1`, and the next student receives rank `2`, resulting in `1, 1, 2, 3, 4, 5, 5...`).

---

### Expected Deliverables

Please provide step-by-step instructions and clean, modular code snippets for:

1. **Database Schema Alterations (SQL):**
   - Query to drop/alter the `phone` column from `students`.
   - Migration for adding `others_marks` (or updating `marks` / `students` tables accordingly).
   - Updates to constraint handling for Kyu values (restricting to Kyu 1 through Kyu 7).

2. **Backend Express API Updates:**
   - Modified `POST /api/students` endpoint (validating `others_marks` between 0–20, handling default `marks` insertion).
   - Updated `GET /api/marks/:kyu` route to return the inbuilt `others` marks.
   - Refactored `GET /api/results/:kyu` route containing the multi-tier tie-breaking SQL query or JavaScript sort algorithm, returning dense ranks (`1, 1, 2, 3...`).

3. **Frontend React Component Updates:**
   - Updated `AddStudent` form layout and validation state.
   - Updated `KyuSelection` grid rendering order.
   - Updated `MarkEntryTable` with read-only `Others` column and adjusted column-saving requirements for enabling the Result button.
   - Updated `ResultSheet` modal/view.

Keep the design consistent with our minimalistic **White and Sky Blue (#87CEEB)** theme on a 1280px grid.
