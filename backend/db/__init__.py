"""
Campus Hive — Database utility scripts.

Scripts in this folder:
  db_check2.py         — Check connection, list tables & row counts → saves db_check_output.txt
  db_reset_and_seed.py — Drop & recreate all tables, seed sample data
  db_migrate.py        — Schema migration (fix enum case, add missing columns)
  db_fix.py            — Targeted column fixes
  db_check.py          — Original quick check

Run from the backend/ folder:
  venv\Scripts\python.exe db\db_check2.py
  venv\Scripts\python.exe db\db_reset_and_seed.py
"""
