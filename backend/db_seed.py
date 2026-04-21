import sys
sys.path.append('.')
from sqlalchemy import text
from core.database import SessionLocal

db = SessionLocal()
try:
    db.execute(text('ALTER TABLE users ADD COLUMN is_platform_admin BOOLEAN DEFAULT FALSE;'))
    db.commit()
    print('Altered table users successfully.')
except Exception as e:
    db.rollback()
    print('Table already altered or error:', str(e))

db.execute(text("UPDATE users SET is_platform_admin = TRUE WHERE email = 'james80@example.net';"))
db.commit()
print('Promoted james80@example.net to admin!')
