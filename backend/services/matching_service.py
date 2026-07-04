from models.all_models import User, Preference, Availability, MatchFeedback
from typing import List, Dict, Any
from sqlalchemy.orm import Session
import json
import os
import numpy as np
from sklearn.neighbors import NearestNeighbors



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



def load_weights() -> dict:
    """Loads weights from weights.json configuration file with fallback defaults."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "core", "weights.json")
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception:
            pass
    # Fallback default values matching static profile allocations
    return {
        "subject_overlap": 0.40,
        "availability_overlap": 0.25,
        "study_type_match": 0.15,
        "collab_tendency_match": 0.10,
        "learning_style_match": 0.05,
        "comm_pref_match": 0.03,
        "competency_match": 0.02
    }


def save_weights(w: dict) -> None:
    """Saves updated weights into weights.json configuration file."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "core", "weights.json")
    try:
        with open(path, "w") as f:
            json.dump(w, f, indent=2)
    except Exception as e:
        print(f"Error saving matching weights: {e}")


def optimize_matching_weights(db: Session, alpha: float = 0.2) -> dict:
    """
    Analyzes historical user ratings to dynamically update match weights.
    Calculates average similarity vector of matches rated highly (rating >= 4.0).
    Applies exponential moving average to adjust parameters without causing volatility.
    """
    feedbacks = db.query(MatchFeedback).all()
    if not feedbacks:
        return load_weights()
        
    successful_pairs = []
    
    # Identify pairs where the match has high overall rating
    for f in feedbacks:
        avg_rating = (f.compatibility_rating + f.collaboration_quality + f.scheduling_ease) / 3.0
        if avg_rating >= 4.0:
            user1 = db.query(User).filter(User.id == f.user_id).first()
            user2 = db.query(User).filter(User.id == f.matched_user_id).first()
            if user1 and user2 and user1.preference and user2.preference:
                successful_pairs.append((user1, user2))
                
    if not successful_pairs:
        return load_weights()
        
    sums = {
        "subject_overlap": 0.0,
        "availability_overlap": 0.0,
        "study_type_match": 0.0,
        "collab_tendency_match": 0.0,
        "learning_style_match": 0.0,
        "comm_pref_match": 0.0,
        "competency_match": 0.0
    }
    
    for u1, u2 in successful_pairs:
        prefs1 = u1.preference
        prefs2 = u2.preference
        
        sums["subject_overlap"] += calculate_subject_overlap(prefs1, prefs2)
        sums["availability_overlap"] += calculate_availability_overlap(u1.availabilities, u2.availabilities)
        sums["study_type_match"] += 1.0 if prefs1.preferred_study_type == prefs2.preferred_study_type else 0.0
        sums["collab_tendency_match"] += 1.0 if prefs1.collaboration_tendency == prefs2.collaboration_tendency else 0.0
        sums["learning_style_match"] += 1.0 if prefs1.learning_style == prefs2.learning_style else 0.0
        sums["comm_pref_match"] += 1.0 if prefs1.communication_preference == prefs2.communication_preference else 0.0
        sums["competency_match"] += calculate_competency_score(prefs1.competency_level, prefs2.competency_level)
        
    n = len(successful_pairs)
    avg_success = {key: val / n for key, val in sums.items()}
    
    total_sim = sum(avg_success.values())
    if total_sim > 0:
        normalized_success = {key: val / total_sim for key, val in avg_success.items()}
    else:
        normalized_success = {key: 1.0 / len(sums) for key in sums}
        
    curr_weights = load_weights()
    new_weights = {}
    for key in curr_weights:
        new_val = (1.0 - alpha) * curr_weights[key] + alpha * normalized_success.get(key, curr_weights[key])
        new_weights[key] = round(new_val, 4)
        
    total_new = sum(new_weights.values())
    if total_new > 0:
        new_weights = {key: round(val / total_new, 4) for key, val in new_weights.items()}
        
    save_weights(new_weights)
    return new_weights


def get_top_user_matches(current_user: User, other_users: List[User], top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Adaptive matching algorithm using Scikit-Learn's NearestNeighbors (KNN).
    Vectorizes and weights subject interests, availabilities, learning styles,
    communication preferences, and academic competencies (Objective 2).
    """
    curr_pref = current_user.preference
    curr_avail = current_user.availabilities
    
    # If the current user lacks preferences, we can't match them.
    if not curr_pref:
        return []

    # Filter other users to only keep those who have preferences defined
    valid_others = [u for u in other_users if u.preference and u.id != current_user.id]
    if not valid_others:
        return []

    # 1. Build dynamic subject vocabulary from preferences of all active users
    all_subjects = set()
    for u in valid_others + [current_user]:
        if u.preference and u.preference.subjects_of_interest:
            for s in u.preference.subjects_of_interest.split(','):
                all_subjects.add(s.strip().lower())
    all_subjects = sorted(list(all_subjects))
    subject_to_idx = {sub: idx for idx, sub in enumerate(all_subjects)}

    # 2. Reference map for days of availability
    day_map = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6
    }

    # 3. Reference sets for category one-hot encodings
    learning_styles = ["visual", "auditory", "reading/writing", "kinesthetic"]
    style_to_idx = {style: idx for idx, style in enumerate(learning_styles)}

    collab_tendencies = ["collaborative peer", "driven leader", "focused learner"]
    collab_to_idx = {collab: idx for idx, collab in enumerate(collab_tendencies)}

    comm_prefs = ["discord", "whatsapp", "zoom", "in-person", "slack", "email", "microsoft teams"]
    comm_to_idx = {comm: idx for idx, comm in enumerate(comm_prefs)}

    study_types = ["group", "buddy"]
    type_to_idx = {stype: idx for idx, stype in enumerate(study_types)}

    competency_levels = {"beginner": 0.25, "intermediate": 0.50, "advanced": 0.75, "expert": 1.0}

    # Load dynamic matching weights
    w = load_weights()

    def vectorize_user(user):
        pref = user.preference
        if not pref:
            dim = len(all_subjects) + 168 + 2 + 3 + 4 + 7 + 1
            return np.zeros(dim)

        # 3.1. Subjects binary vector
        sub_vec = np.zeros(len(all_subjects))
        if pref.subjects_of_interest:
            for s in pref.subjects_of_interest.split(','):
                s_clean = s.strip().lower()
                if s_clean in subject_to_idx:
                    sub_vec[subject_to_idx[s_clean]] = 1.0
        # Normalise sub-vector
        sub_norm = np.linalg.norm(sub_vec)
        if sub_norm > 0:
            sub_vec = sub_vec / sub_norm

        # 3.2. Weekly availability binary vector (168 dimensions)
        avail_vec = np.zeros(168)
        for a in user.availabilities:
            day_clean = a.day_of_week.strip().lower()
            if day_clean in day_map:
                d_idx = day_map[day_clean]
                start_h = a.start_time.hour
                end_h = a.end_time.hour
                for h in range(start_h, end_h):
                    if 0 <= h < 24:
                        avail_vec[d_idx * 24 + h] = 1.0
        # Normalise sub-vector
        avail_norm = np.linalg.norm(avail_vec)
        if avail_norm > 0:
            avail_vec = avail_vec / avail_norm

        # 3.3. Study Type vector (2)
        type_vec = np.zeros(2)
        type_clean = (pref.preferred_study_type or "group").strip().lower()
        if type_clean in type_to_idx:
            type_vec[type_to_idx[type_clean]] = 1.0
        type_norm = np.linalg.norm(type_vec)
        if type_norm > 0:
            type_vec = type_vec / type_norm

        # 3.4. Collaboration Tendency vector (3)
        collab_vec = np.zeros(3)
        collab_clean = (pref.collaboration_tendency or "collaborative peer").strip().lower()
        if collab_clean in collab_to_idx:
            collab_vec[collab_to_idx[collab_clean]] = 1.0
        collab_norm = np.linalg.norm(collab_vec)
        if collab_norm > 0:
            collab_vec = collab_vec / collab_norm

        # 3.5. Learning Style vector (4)
        style_vec = np.zeros(4)
        style_clean = (pref.learning_style or "visual").strip().lower()
        if style_clean in style_to_idx:
            style_vec[style_to_idx[style_clean]] = 1.0
        style_norm = np.linalg.norm(style_vec)
        if style_norm > 0:
            style_vec = style_vec / style_norm

        # 3.6. Communication Preference vector (7)
        comm_vec = np.zeros(7)
        comm_clean = (pref.communication_preference or "discord").strip().lower()
        if comm_clean in comm_to_idx:
            comm_vec[comm_to_idx[comm_clean]] = 1.0
        comm_norm = np.linalg.norm(comm_vec)
        if comm_norm > 0:
            comm_vec = comm_vec / comm_norm

        # 3.7. Competency normalized scalar
        comp_clean = (pref.competency_level or "beginner").strip().lower()
        comp_val = competency_levels.get(comp_clean, 0.25)
        comp_vec = np.array([comp_val])

        # Apply weights to match weighted distance sum formula
        sub_vec = sub_vec * np.sqrt(w.get("subject_overlap", 0.40))
        avail_vec = avail_vec * np.sqrt(w.get("availability_overlap", 0.25))
        type_vec = type_vec * np.sqrt(w.get("study_type_match", 0.15))
        collab_vec = collab_vec * np.sqrt(w.get("collab_tendency_match", 0.10))
        style_vec = style_vec * np.sqrt(w.get("learning_style_match", 0.05))
        comm_vec = comm_vec * np.sqrt(w.get("comm_pref_match", 0.03))
        comp_vec = comp_vec * np.sqrt(w.get("competency_match", 0.02))

        return np.concatenate([sub_vec, avail_vec, type_vec, collab_vec, style_vec, comm_vec, comp_vec])

    # Convert current user preference profile to query vector
    query_vector = vectorize_user(current_user)

    # Convert other users to feature vectors matrix
    other_vectors = np.array([vectorize_user(u) for u in valid_others])

    # Initialize Scikit-Learn's NearestNeighbors model (KNN)
    # n_neighbors cannot exceed total count of other users
    k_val = min(top_n, len(valid_others))
    knn = NearestNeighbors(n_neighbors=k_val, metric="cosine")
    knn.fit(other_vectors)

    distances, indices = knn.kneighbors([query_vector])

    matches = []
    for idx, dist in zip(indices[0], distances[0]):
        matched_user = valid_others[idx]
        other_pref = matched_user.preference
        
        # Convert cosine distance back to compatibility score out of 100%
        raw_score = (1.0 - dist) * 100
        comp_score = max(0.0, min(100.0, round(raw_score, 1)))

        # Compute granular similarity parameters to generate UI explanations (Objective 1)
        sub_score = calculate_subject_overlap(curr_pref, other_pref)
        avail_score = calculate_availability_overlap(curr_avail, matched_user.availabilities)
        study_type_score = 1.0 if curr_pref.preferred_study_type == other_pref.preferred_study_type else 0.0
        collab_score = 1.0 if curr_pref.collaboration_tendency == other_pref.collaboration_tendency else 0.0
        style_score = 1.0 if curr_pref.learning_style == other_pref.learning_style else 0.0
        comm_score = 1.0 if curr_pref.communication_preference == other_pref.communication_preference else 0.0
        comp_score_val = calculate_competency_score(curr_pref.competency_level, other_pref.competency_level)

        explanation = generate_explanation(
            sub_score, avail_score, style_score, comm_score, comp_score_val, curr_pref
        )

        shared_subjects = []
        if curr_pref.subjects_of_interest and other_pref.subjects_of_interest:
            set1 = set([s.strip().lower() for s in curr_pref.subjects_of_interest.split(',')])
            set2 = set([s.strip().lower() for s in other_pref.subjects_of_interest.split(',')])
            shared_subjects = list(set1.intersection(set2))

        matches.append({
            "target_user_id": matched_user.id,
            "full_name": matched_user.full_name,
            "email": matched_user.email,
            "department": matched_user.department,
            "learning_style": other_pref.learning_style,
            "shared_subjects": shared_subjects,
            "compatibility_score": comp_score,
            "explanation": explanation
        })

    # Sort final matches list by compatibility score descending
    matches.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return matches
