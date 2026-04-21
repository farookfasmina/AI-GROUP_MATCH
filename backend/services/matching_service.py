from models.all_models import User, Preference, Availability
from typing import List, Dict, Any
import json
import os

def calculate_subject_overlap(prefs1: Preference, prefs2: Preference) -> float:
    """Calculates Jaccard similarity between two users' subjects of interest."""
    if not prefs1 or not prefs2 or not prefs1.subjects_of_interest or not prefs2.subjects_of_interest:
        return 0.0
        
    set1 = set([s.strip().lower() for s in prefs1.subjects_of_interest.split(',')])
    set2 = set([s.strip().lower() for s in prefs2.subjects_of_interest.split(',')])
    
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    
    return intersection / union if union > 0 else 0.0

def calculate_availability_overlap(availabilities1: List[Availability], availabilities2: List[Availability]) -> float:
    """
    Calculates the total percentage of shared time between two users.
    Normalizes overlap where reaching 5 hours (300 mins) of shared time per week equals 100%.
    """
    if not availabilities1 or not availabilities2:
        return 0.0
        
    total_overlap_minutes = 0
    for a1 in availabilities1:
        for a2 in availabilities2:
            if a1.day_of_week == a2.day_of_week:
                # Determine the overlapping interval
                start = max(a1.start_time, a2.start_time)
                end = min(a1.end_time, a2.end_time)
                
                if start < end:
                    # Convert time to minutes for arithmetic
                    s_mins = start.hour * 60 + start.minute
                    e_mins = end.hour * 60 + end.minute
                    total_overlap_minutes += (e_mins - s_mins)
    
    # Cap matching at 300 minutes (5 hours) for 1.0 score
    return min(total_overlap_minutes / 300.0, 1.0)

def calculate_competency_score(level1: str, level2: str) -> float:
    """
    Scores competency. 
    1.0 for exact matches, 0.5 for adjacent levels (e.g. Beginner/Intermediate).
    """
    if not level1 or not level2:
        return 0.0
        
    levels = {"Beginner": 1, "Intermediate": 2, "Advanced": 3, "Expert": 4}
    
    val1 = levels.get(level1, 0)
    val2 = levels.get(level2, 0)
    
    if val1 == 0 or val2 == 0:
        return 0.0
        
    diff = abs(val1 - val2)
    if diff == 0:
        return 1.0     # Exact match
    elif diff == 1:
        return 0.5     # Adjacent levels (e.g., matching a Beginner with an Intermediate)
    else:
        return 0.0

def generate_explanation(sub_score: float, avail_score: float, style_score: float, comm_score: float, comp_score: float, curr_pref: Preference) -> str:
    """Generates a human-readable explanation of why users matched."""
    explanations = []
    
    if sub_score > 0.5:
        explanations.append("High overlap in subjects of interest.")
    elif sub_score > 0:
        explanations.append("Shares some subjects of interest.")
        
    if avail_score > 0:
        explanations.append("Compatible study schedules.")
        
    if style_score > 0:
        explanations.append(f"Both prefer {curr_pref.learning_style} learning.")
        
    if comm_score > 0:
        explanations.append(f"Matching communication preference.")
        
    if comp_score == 1.0:
        explanations.append("Perfect competency match.")
    elif comp_score == 0.5:
        explanations.append("Complementary competency levels.")

    if curr_pref.preferred_study_type:
        explanations.append(f"Both seeking a {curr_pref.preferred_study_type} format.")
        
    if curr_pref.collaboration_tendency:
        explanations.append(f"Matching collaboration tendency ({curr_pref.collaboration_tendency}).")
        
    # If no real matches found but algorithm still scores it
    if not explanations:
        return "No significant shared preferences."
        
    return " ".join(explanations)


def get_top_user_matches(current_user: User, other_users: List[User], top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Adaptive matching algorithm using stable, research-backed weights.
    Prioritizes academic synergy and social preferences (Objective 1).
    """
    # High-quality static weights based on project proposal requirements
    w = {
        "subject_overlap": 0.40,      # Academic synergy (Research Obj 2)
        "availability_overlap": 0.25, # Practical feasibility
        "study_type_match": 0.15,     # Social preference: Group/Buddy (Research Obj 1)
        "collab_tendency_match": 0.10, # Social preference: Personality (Research Obj 1)
        "learning_style_match": 0.05,
        "comm_pref_match": 0.03,
        "competency_match": 0.02
    }

    curr_pref = current_user.preference
    curr_avail = current_user.availabilities
    
    # If the current user lacks preferences, we can't meaningfully match them.
    if not curr_pref:
        return []
        
    matches = []
    
    for user in other_users:
        if current_user.id == user.id:
            continue
            
        other_pref = user.preference
        other_avail = user.availabilities
        
        # Skip users without preferences
        if not other_pref:
            continue
            
        # 1. Subject Overlap (40%)
        sub_score = calculate_subject_overlap(curr_pref, other_pref)
        
        # 2. Availability Overlap (25%)
        avail_score = calculate_availability_overlap(curr_avail, other_avail)
        
        # 3. Preferred Study Type (15%) - Objective 1
        study_type_score = 1.0 if curr_pref.preferred_study_type == other_pref.preferred_study_type else 0.0

        # 4. Collaboration Tendency (10%) - Objective 1
        collab_score = 1.0 if curr_pref.collaboration_tendency == other_pref.collaboration_tendency else 0.0

        # 5. Study Style (10%)
        style_score = 1.0 if curr_pref.learning_style == other_pref.learning_style else 0.0
        
        # 6. Communication Preference (5%)
        comm_score = 1.0 if curr_pref.communication_preference == other_pref.communication_preference else 0.0
        
        # 7. Competency Level (5%)
        comp_score = calculate_competency_score(curr_pref.competency_level, other_pref.competency_level)
        
        # Compute Weighted Final Score using Data-Driven weights
        final_score = (
            (sub_score * w.get("subject_overlap", 0)) +
            (avail_score * w.get("availability_overlap", 0)) +
            (study_type_score * w.get("study_type_match", 0)) +
            (collab_score * w.get("collab_tendency_match", 0)) +
            (style_score * w.get("learning_style_match", 0)) +
            (comm_score * w.get("comm_pref_match", 0)) +
            (comp_score * w.get("competency_match", 0))
        )
        
        # Get textual explanation
        explanation = generate_explanation(sub_score, avail_score, style_score, comm_score, comp_score, curr_pref)
        
        # Identify exactly which subjects overlap
        shared_subjects = []
        if curr_pref.subjects_of_interest and other_pref.subjects_of_interest:
            set1 = set([s.strip().lower() for s in curr_pref.subjects_of_interest.split(',')])
            set2 = set([s.strip().lower() for s in other_pref.subjects_of_interest.split(',')])
            shared_subjects = list(set1.intersection(set2))

        matches.append({
            "target_user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "department": user.department,
            "learning_style": other_pref.learning_style,
            "shared_subjects": shared_subjects,
            "compatibility_score": round(final_score * 100, 1), # Return as a percentage out of 100
            "explanation": explanation
        })
        
    # Sort matches by compatibility_score descending
    matches.sort(key=lambda x: x["compatibility_score"], reverse=True)
    
    # Return Top N
    return matches[:top_n]
