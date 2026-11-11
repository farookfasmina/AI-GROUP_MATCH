"""Study tip of the day: a small challenge and a resource for one of the student's subjects.

These are prepared tips picked by subject - not machine learning. (The first version only had
tips for "CS101", "Python" and "Math", which are not in the subject catalogue, so every
student always got the two general tips.)
"""
import random
from typing import List

from sqlalchemy.orm import Session

from models.all_models import Membership, Preference, StudyGroup, StudyInsight

# A tip set is used when its key is part of the subject name (lower case).
TIPS = {
    "programming": (
        [("Trace it by hand", "Pick a short loop from this week's lab and write down the value of every variable after each round. Compare with a group member."),
         ("Explain a bug", "Find one bug you fixed this week and explain to your group what caused it, in two sentences.")],
        [("Rubber duck method", "Say your code out loud, line by line, before asking for help. Most bugs show up while you explain.")]),
    "data structures": (
        [("Pick the structure", "For a to-do list, a browser back button and a phone book: which data structure fits each, and why? Discuss in the chat."),
         ("Big O in one line", "Explain why binary search is O(log n) to your group without using the word 'logarithm'.")],
        [("Draw before you code", "Draw the list, tree or graph on paper and move the pointers by hand before writing any code.")]),
    "database": (
        [("Normalise it", "Take one messy table (name, course1, course2, lecturer phone) and split it into tables in third normal form. Compare answers."),
         ("One query, two ways", "Write the same query once with a JOIN and once with a subquery. Which one is easier to read?")],
        [("Sketch the ER diagram", "Before writing SQL, sketch the entities and relationships. It prevents most design mistakes.")]),
    "web": (
        [("Rebuild a page", "Pick one small part of a site you use (a card, a menu) and rebuild it with HTML and CSS only. Share a screenshot."),
         ("Request journey", "Explain to your group what happens between typing a URL and seeing the page, in five steps.")],
        [("Browser dev tools", "Open the Network tab while loading a page and see every request your page makes.")]),
    "network": (
        [("Layer by layer", "Name the OSI layers from memory, then say one protocol for each. Check each other."),
         ("Subnet sprint", "How many hosts fit in a /26 network? Work it out without a calculator and explain the steps.")],
        [("Packet tracing", "Use a packet tracer or 'tracert' on a real site and discuss each hop you see.")]),
    "software engineering": (
        [("User story swap", "Each member writes one user story for a library system. Swap, and add acceptance criteria to someone else's."),
         ("Spot the smell", "Find one long function in old coursework and agree, as a group, how to split it.")],
        [("Small commits", "Commit one change at a time with a clear message. Your group can review it far more easily.")]),
    "machine learning": (
        [("Overfitting in plain words", "Explain overfitting to your group with an everyday example, with no formulas."),
         ("Which model?", "For spam detection, house prices and customer groups: classification, regression or clustering? Say why.")],
        [("Start with a baseline", "Always try the simplest model first. It tells you whether a complex one is worth it.")]),
    "mobile": (
        [("Paper prototype", "Draw three screens of an app idea on paper and let a group member 'tap' through them."),
         ("Lifecycle check", "What happens to an app's screen when the phone rotates or a call comes in? Explain to your group.")],
        [("Test on a real phone", "Emulators hide slow screens and touch problems. Try your app on a real device early.")]),
    "statistic": (
        [("Mean or median?", "Find one real example where the mean is misleading and the median is better. Share it in the chat."),
         ("Explain a p-value", "Explain what a p-value of 0.03 means, in one sentence, without saying 'probability the hypothesis is true'.")],
        [("Plot first", "Draw a quick chart of the data before calculating anything. Outliers are easy to see.")]),
    "security": (
        [("Threat model", "For your campus Wi-Fi, list three threats and one defence for each. Compare lists."),
         ("Hash or encrypt?", "Explain to your group why passwords are hashed and not encrypted.")],
        [("Practise safely", "Use legal practice sites and labs to try attacks and defences - never real systems.")]),
}
GENERAL = (
    [("Study Sprint", "Set a timer for 25 minutes and focus on one core concept in your current subject."),
     ("The Teacher Technique", "Explain the most difficult concept you learned today to a group member as if they were new to the subject.")],
    [("Flashcard Method", "Use flashcards to test yourself this week instead of only re-reading notes.")])


def tips_for(subjects: List[str]):
    """The tip set of one of the student's subjects, or the general tips."""
    found = [tips for s in subjects for key, tips in TIPS.items() if key in s.lower()]
    return random.choice(found) if found else GENERAL


def generate_user_insights(db: Session, user_id: int) -> List[StudyInsight]:
    """One challenge and one resource for a subject the student studies."""
    subjects = []
    prefs = db.query(Preference).filter(Preference.user_id == user_id).first()
    if prefs and prefs.subjects_of_interest:
        subjects += [s.strip() for s in prefs.subjects_of_interest.split(",") if s.strip()]
    group_ids = [m.group_id for m in db.query(Membership).filter(Membership.user_id == user_id).all()]
    if group_ids:
        subjects += [g.subject for g in db.query(StudyGroup).filter(StudyGroup.id.in_(group_ids)).all()]

    challenges, resources = tips_for(subjects)
    insights = []
    for kind, (title, content) in (("challenge", random.choice(challenges)), ("resource", random.choice(resources))):
        row = StudyInsight(user_id=user_id, title=title, content=content, type=kind)
        db.add(row)
        insights.append(row)
    db.commit()
    return insights
