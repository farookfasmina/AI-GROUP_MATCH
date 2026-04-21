import random
from typing import List, Dict
from sqlalchemy.orm import Session
from models.all_models import StudyGroup, StudyInsight, Membership, Preference

# Expert-Curated Challenge Templates by Subject
CHALLENGE_TEMPLATES = {
    "CS101": [
        {"title": "The Logic Loop", "content": "Explain the difference between a 'while' loop and a 'do-while' loop in under 50 words to your group members.", "type": "challenge"},
        {"title": "Binary Mastery", "content": "Convert the decimal number 156 to binary without using a calculator. Share the steps in the group chat!", "type": "challenge"}
    ],
    "Python": [
        {"title": "List Comprehension Duel", "content": "Rewrite a standard 4-line 'for' loop into a single line of Pythonic list comprehension.", "type": "challenge"},
        {"title": "Decorators Explained", "content": "Find a real-world analogy for a Python decorator and explain it in the chat.", "type": "challenge"}
    ],
    "Math": [
        {"title": "Derivation Sprint", "content": "Differentiate f(x) = (3x^2 + 2x) * sin(x). Check your group members' results!", "type": "challenge"},
        {"title": "Prime Factorization", "content": "Find all prime factors of 1024. Is it a power of 2?", "type": "challenge"}
    ],
    "Default": [
        {"title": "Study Sprint", "content": "Set a Pomodoro timer for 25 minutes and focus purely on one core concept in your current subject.", "type": "challenge"},
        {"title": "The Teacher Technique", "content": "Explain the most difficult concept you learned today to a group member as if they were 5 years old.", "type": "challenge"}
    ]
}

RESOURCE_TEMPLATES = {
    "CS101": [
        {"title": "Big O Cheat Sheet", "content": "Check out the official Big O complexity chart for common sorting algorithms.", "type": "resource"}
    ],
    "Python": [
        {"title": "Real Python Tutorials", "content": "Highly recommended: The 'Effective Python' guide for intermediate trickery.", "type": "resource"}
    ],
    "Default": [
        {"title": "Flashcard Method", "content": "Use Anki or Quizlet to automate your active recall sessions this week.", "type": "resource"}
    ]
}

def generate_user_insights(db: Session, user_id: int) -> List[StudyInsight]:
    """
    Generates personalized study insights based on user membership subjects.
    Fallbacks to 'Default' if no group subjects are found.
    """
    # 1. Identify relevant subjects from user groups
    memberships = db.query(Membership).filter(Membership.user_id == user_id).all()
    group_ids = [m.group_id for m in memberships]
    group_subjects = []
    if group_ids:
        groups = db.query(StudyGroup).filter(StudyGroup.id.in_(group_ids)).all()
        group_subjects = [g.subject for g in groups]

    # 2. Identify relevant subjects from user preferences
    pref_subjects = []
    prefs = db.query(Preference).filter(Preference.user_id == user_id).first()
    if prefs and prefs.subjects_of_interest:
        pref_subjects = [s.strip() for s in prefs.subjects_of_interest.split(',') if s.strip()]

    # 3. Intelligent Filtering: Only consider subjects with available templates
    all_raw_subjects = group_subjects + pref_subjects
    valid_subjects = [s for s in all_raw_subjects if s in CHALLENGE_TEMPLATES]

    # 4. Selection Logic: Pick a valid subject or fallback to Default
    if valid_subjects:
        # We prioritize preferences for testing if they exist in the valid set
        valid_prefs = [p for p in pref_subjects if p in CHALLENGE_TEMPLATES]
        if valid_prefs:
            prime_subject = random.choice(valid_prefs)
        else:
            prime_subject = random.choice(valid_subjects)
    else:
        prime_subject = "Default"

    # Final safety check
    if prime_subject not in CHALLENGE_TEMPLATES:
        prime_subject = "Default"

    insights = []
    
    # 2. Generate a Challenge
    c_templates = CHALLENGE_TEMPLATES.get(prime_subject, CHALLENGE_TEMPLATES["Default"])
    challenge = random.choice(c_templates)
    
    new_challenge = StudyInsight(
        user_id=user_id,
        title=challenge["title"],
        content=challenge["content"],
        type="challenge"
    )
    db.add(new_challenge)
    insights.append(new_challenge)
    
    # 3. Generate a Resource
    r_templates = RESOURCE_TEMPLATES.get(prime_subject, RESOURCE_TEMPLATES["Default"])
    resource = random.choice(r_templates)
    
    new_resource = StudyInsight(
        user_id=user_id,
        title=resource["title"],
        content=resource["content"],
        type="resource"
    )
    db.add(new_resource)
    insights.append(new_resource)
    
    db.commit()
    return insights
