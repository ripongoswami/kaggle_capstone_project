from typing import List, Dict

class VideoRanker:
    def __init__(self):
        pass

    def rank_videos(self, videos: List[Dict], max_duration_minutes: int = 30) -> List[Dict]:
        """
        Filters out videos longer than max_duration_minutes, and scores relevance.
        """
        ranked = []
        max_duration_seconds = max_duration_minutes * 60

        for video in videos:
            duration_sec = video.get("duration_seconds", 600)
            if duration_sec > max_duration_seconds:
                continue # Skip video if it exceeds limit

            # Basic relevance score based on title keyword match
            title = video.get("title", "").lower()
            score = 1.0
            
            # Simple grading heuristic
            if "tutorial" in title or "course" in title:
                score += 0.2
            if "introduction" in title or "beginner" in title:
                score += 0.1
            if "rick" in title or "roll" in title: # Filter meme videos
                score -= 0.8
                
            video["relevance_score"] = round(min(score, 1.5), 2)
            ranked.append(video)

        # Sort by relevance score in descending order
        ranked.sort(key=lambda x: x["relevance_score"], reverse=True)
        return ranked
