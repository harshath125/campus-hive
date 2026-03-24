"""
Enhanced Vibe Matching Algorithm for Campus Hive.
Uses TF-IDF + Cosine Similarity + Weighted Multi-Factor Scoring.
"""
import math
from typing import List, Dict, Tuple
from collections import Counter


def _tfidf_vectors(tags_list: List[List[str]]) -> Tuple[Dict[str, float], List[Dict[str, float]]]:
    """
    Compute TF-IDF vectors for a list of tag-lists.
    Returns (idf_dict, list_of_tfidf_vectors).
    """
    n_docs = len(tags_list)
    if n_docs == 0:
        return {}, []

    # Document frequency: how many users have each tag
    doc_freq = Counter()
    for tags in tags_list:
        unique_tags = set(t.strip().lower() for t in tags if t.strip())
        for tag in unique_tags:
            doc_freq[tag] += 1

    # IDF = log(N / df) + 1  (smoothed)
    idf = {}
    for tag, df in doc_freq.items():
        idf[tag] = math.log(n_docs / df) + 1.0

    # TF-IDF vectors
    vectors = []
    for tags in tags_list:
        clean_tags = [t.strip().lower() for t in tags if t.strip()]
        tf = Counter(clean_tags)
        total = len(clean_tags) if clean_tags else 1
        vec = {}
        for tag, count in tf.items():
            vec[tag] = (count / total) * idf.get(tag, 1.0)
        vectors.append(vec)

    return idf, vectors


def _cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """Compute cosine similarity between two sparse vectors."""
    if not vec1 or not vec2:
        return 0.0

    # Intersection of keys
    common_keys = set(vec1.keys()) & set(vec2.keys())
    if not common_keys:
        return 0.0

    dot_product = sum(vec1[k] * vec2[k] for k in common_keys)
    norm1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
    norm2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return dot_product / (norm1 * norm2)


def _jaccard_similarity(tags1: List[str], tags2: List[str]) -> float:
    """Classic Jaccard Similarity as fallback/component."""
    set1 = {t.strip().lower() for t in tags1 if t.strip()}
    set2 = {t.strip().lower() for t in tags2 if t.strip()}
    if not set1 and not set2:
        return 0.0
    intersection = set1 & set2
    union = set1 | set2
    if not union:
        return 0.0
    return len(intersection) / len(union)


def get_common_tags(tags1: List[str], tags2: List[str]) -> List[str]:
    """Return tags common to both users."""
    set1 = {t.strip().lower() for t in tags1 if t.strip()}
    return list({t.strip().lower() for t in tags2 if t.strip().lower() in set1})


def calculate_vibe_score(
    current_user_tags: List[str],
    other_user_tags: List[str],
    current_user_branch: str = "",
    other_user_branch: str = "",
    current_user_year: int = None,
    other_user_year: int = None,
    current_user_section: str = "",
    other_user_section: str = "",
    all_users_tags: List[List[str]] = None,
    current_user_idx: int = 0,
    other_user_idx: int = 1,
    tfidf_vectors: List[Dict[str, float]] = None,
) -> float:
    """
    Calculate a comprehensive vibe score (0-100) using multiple factors:
    
    1. Tag Similarity (50% weight):
       - TF-IDF cosine similarity (prioritizes rare shared interests)
       - Jaccard similarity (overall overlap)
       - Blended: 60% TF-IDF + 40% Jaccard
    
    2. Branch Match (15% weight):
       - Same branch = 100%, different = 0%
    
    3. Year Proximity (15% weight):
       - Same year = 100%, 1 year diff = 70%, 2 = 40%, 3+ = 10%
    
    4. Section Match (10% weight):
       - Same section = 100%, different = 0%
    
    5. Tag Count Bonus (10% weight):
       - More shared tags = higher bonus (capped at 100%)
    """
    # ── 1. Tag Similarity (50%) ─────────────────────────────────────────────
    tag_score = 0.0
    
    if current_user_tags and other_user_tags:
        # TF-IDF Cosine Similarity
        tfidf_score = 0.0
        if tfidf_vectors and current_user_idx < len(tfidf_vectors) and other_user_idx < len(tfidf_vectors):
            tfidf_score = _cosine_similarity(
                tfidf_vectors[current_user_idx],
                tfidf_vectors[other_user_idx]
            )
        else:
            # Fallback: compute pairwise TF-IDF
            _, vecs = _tfidf_vectors([current_user_tags, other_user_tags])
            if len(vecs) == 2:
                tfidf_score = _cosine_similarity(vecs[0], vecs[1])

        # Jaccard Similarity
        jaccard_score = _jaccard_similarity(current_user_tags, other_user_tags)

        # Blend: 60% TF-IDF + 40% Jaccard
        tag_score = (0.6 * tfidf_score + 0.4 * jaccard_score) * 100
    
    # ── 2. Branch Match (15%) ───────────────────────────────────────────────
    branch_score = 0.0
    if current_user_branch and other_user_branch:
        if current_user_branch.strip().lower() == other_user_branch.strip().lower():
            branch_score = 100.0
    
    # ── 3. Year Proximity (15%) ─────────────────────────────────────────────
    year_score = 50.0  # default if year unknown
    if current_user_year is not None and other_user_year is not None:
        diff = abs(current_user_year - other_user_year)
        if diff == 0:
            year_score = 100.0
        elif diff == 1:
            year_score = 70.0
        elif diff == 2:
            year_score = 40.0
        else:
            year_score = 10.0
    
    # ── 4. Section Match (10%) ──────────────────────────────────────────────
    section_score = 0.0
    if current_user_section and other_user_section:
        if current_user_section.strip().lower() == other_user_section.strip().lower():
            section_score = 100.0
    
    # ── 5. Tag Count Bonus (10%) ────────────────────────────────────────────
    common = get_common_tags(current_user_tags or [], other_user_tags or [])
    tag_count_score = min(len(common) * 25, 100)  # 4+ shared tags = max score
    
    # ── Weighted Final Score ────────────────────────────────────────────────
    final_score = (
        tag_score * 0.50 +
        branch_score * 0.15 +
        year_score * 0.15 +
        section_score * 0.10 +
        tag_count_score * 0.10
    )
    
    return round(min(final_score, 100.0), 1)


def find_vibe_matches(current_user, all_other_users, top_n: int = 10) -> List[dict]:
    """
    Find the best vibe matches for a user from a list of other users.
    
    Args:
        current_user: User model instance (with tags, branch, year, section)
        all_other_users: queryset/list of User model instances
        top_n: number of top matches to return
    
    Returns:
        List of match dicts sorted by score (descending), each containing:
        - user: user.to_dict()
        - score: float (0-100)
        - common_tags: list of shared tags
        - match_factors: breakdown of scoring factors
    """
    if not current_user.tags:
        return []

    # Build tag lists for all users for TF-IDF computation
    all_tags_lists = [current_user.tags or []]
    user_list = list(all_other_users)
    for u in user_list:
        all_tags_lists.append(u.tags or [])

    # Compute TF-IDF vectors for all users at once (efficient)
    _, tfidf_vecs = _tfidf_vectors(all_tags_lists)

    results = []
    for idx, other in enumerate(user_list):
        other_tags = other.tags or []
        common = get_common_tags(current_user.tags, other_tags)

        score = calculate_vibe_score(
            current_user_tags=current_user.tags,
            other_user_tags=other_tags,
            current_user_branch=current_user.branch or "",
            other_user_branch=other.branch or "",
            current_user_year=current_user.year,
            other_user_year=other.year,
            current_user_section=current_user.section or "",
            other_user_section=other.section or "",
            tfidf_vectors=tfidf_vecs,
            current_user_idx=0,
            other_user_idx=idx + 1,
        )

        if score > 0:
            results.append({
                "user": other.to_dict(),
                "score": score,
                "common_tags": common,
                "match_factors": {
                    "tags_similarity": round(score * 0.5 / 50 * 100, 1) if score > 0 else 0,
                    "branch_match": current_user.branch == other.branch if current_user.branch and other.branch else False,
                    "year_proximity": abs((current_user.year or 0) - (other.year or 0)),
                    "section_match": current_user.section == other.section if current_user.section and other.section else False,
                    "shared_count": len(common),
                },
            })

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_n]
