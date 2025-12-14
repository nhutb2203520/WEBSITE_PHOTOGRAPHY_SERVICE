import uvicorn
import requests
from io import BytesIO
from typing import List, Optional
import time

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
from sentence_transformers import SentenceTransformer, util
import numpy as np
import cv2 
from sklearn.cluster import KMeans

# Initialize FastAPI app
app = FastAPI()

# --- 1. MODEL LOADING ---
# Load CLIP model at startup. Prioritize the larger model for better accuracy,
# fallback to a smaller one if resources are constrained.
print("⏳ [INIT] Loading AI model...")
start_time = time.time()
try:
    # Large model: Higher accuracy, requires more RAM/VRAM
    model = SentenceTransformer('clip-ViT-L-14') 
    print(f"✅ [INIT] Loaded model CLIP ViT-L-14 (Time: {time.time() - start_time:.2f}s)")
except Exception as e:
    print(f"⚠️ [INIT] Failed to load L-14 ({str(e)}), falling back to B-32")
    # Base model: Faster, requires less resources
    try:
        model = SentenceTransformer('clip-ViT-B-32')
        print(f"✅ [INIT] Loaded model CLIP ViT-B-32 (Time: {time.time() - start_time:.2f}s)")
    except Exception as e_fallback:
        print(f"❌ [INIT] Critical Error: Could not load any AI model. Service will not function correctly. ({str(e_fallback)})")
        # In production, you might want to exit here or handle this more gracefully.

print("✅ [INIT] AI Service is ready on port 8000!")


# --- 2. DATA MODELS ---
class ImageRequest(BaseModel):
    """Request model for image analysis."""
    image_url: str

class CandidateItem(BaseModel):
    """Represents an image candidate for ranking."""
    id: str
    vector: List[float]       # Content vector (CLIP)
    color_vector: Optional[List[float]] = None # Color vector (Histogram) - Optional for backward compatibility

class RankingRequest(BaseModel):
    """Request model for ranking similar images."""
    query_vector: List[float]
    query_color_vector: List[float]
    candidates: List[CandidateItem]


# --- 3. HELPER FUNCTIONS ---

def get_color_vector(pil_img):
    """
    Calculates a 3D color histogram in HSV space (8x8x8 = 512 dimensions).
    HSV separates color (Hue) from intensity, making it robust to lighting changes.
    """
    try:
        # Convert PIL Image to OpenCV format (RGB -> HSV)
        # Note: PIL images are RGB, OpenCV expects images in BGR or RGB depending on loading method.
        # Here we convert directly from the PIL RGB array.
        img_np = np.array(pil_img)
        img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
        
        # Calculate Histogram: 8 bins for each channel (H, S, V)
        # Ranges: Hue (0-180), Saturation (0-256), Value (0-256) in OpenCV
        hist = cv2.calcHist([img_cv], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
        
        # Normalize the histogram so it's scale-invariant (image size doesn't matter)
        cv2.normalize(hist, hist)
        
        return hist.flatten().tolist()
    except Exception as e:
        print(f"❌ [ERROR] Error calculating color vector: {e}")
        # Return a zero vector of correct dimension as fallback
        return [0.0] * 512
def extract_color_palette(pil_img, num_colors=5):
    """
    Trích xuất 5 màu chủ đạo (Hex code)
    """
    try:
        img = pil_img.copy().convert("RGB")
        img = img.resize((100, 100)) # Resize nhỏ để chạy nhanh
        ar = np.asarray(img)
        
        # ✅ ĐÃ SỬA: Dùng np.prod thay vì np.product
        ar = ar.reshape(np.prod(ar.shape[:2]), ar.shape[2]).astype(float)

        kmeans = KMeans(n_clusters=num_colors, n_init=10)
        kmeans.fit(ar)
        colors = kmeans.cluster_centers_
        
        hex_colors = []
        for color in colors:
            hex_colors.append('#%02x%02x%02x' % (int(color[0]), int(color[1]), int(color[2])))
        return hex_colors
    except Exception as e:
        print(f"❌ [LỖI TRÍCH XUẤT MÀU]: {str(e)}")
        return ["#000000"]

# --- 4. API ENDPOINTS ---

@app.post("/analyze")
async def analyze_image(req: ImageRequest):
    """
    Analyzes an image from a URL to extract content (CLIP) and color features.
    """
    print(f"\n🔍 [ANALYZE] Received analysis request: {req.image_url}")
    start_time = time.time()
    
    try:
        # 1. Download Image
        print("   [1/4] Downloading image...")
        headers = {'User-Agent': 'Mozilla/5.0'} # Spoof User-Agent to avoid some basic bot protections
        
        try:
            response = requests.get(req.image_url, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"   ⚠️ Download failed with headers (Status {response.status_code}), retrying without...")
                response = requests.get(req.image_url, timeout=10)
            response.raise_for_status() # Raise exception for bad status codes
        except Exception as dl_err:
             raise HTTPException(status_code=400, detail=f"Failed to download image: {str(dl_err)}")

        img = Image.open(BytesIO(response.content)).convert("RGB")
        print(f"   ✅ Download successful (Size: {img.size})")

        # 2. Extract Content Vector (CLIP)
        print("   [2/4] Extracting content vector (CLIP)...")
        clip_vector = model.encode(img).tolist()
        print(f"   ✅ Content vector calculated (Length: {len(clip_vector)})")

        # 3. Extract Color Vector (Histogram)
        print("   [3/4] Extracting color vector (Histogram)...")
        color_vector = get_color_vector(img)
        print(f"   ✅ Color vector calculated (Length: {len(color_vector)})")

        # 4. Extract Palette (Dominant Colors)
        print("   [4/4] Extracting color palette...")
        palette = extract_color_palette(img, 5)
        print(f"   ✅ Palette: {palette}")

        total_time = time.time() - start_time
        print(f"✨ [ANALYZE] Analysis complete in {total_time:.2f}s\n")

        return {
            "success": True,
            "vector": clip_vector,
            "color_vector": color_vector,
            "palette": palette,
            "dominant_color": palette[0] if palette else "#000000"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ [ERROR] AI Analyze Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.post("/rank")
async def rank_similarity(req: RankingRequest):
    """
    Ranks a list of candidates against a query based on content and color similarity.
    Uses a hybrid scoring mechanism.
    """
    print(f"\n🏆 [RANK] Received ranking request for {len(req.candidates)} candidates")
    start_time = time.time()
    
    try:
        if not req.candidates:
            print("   ⚠️ Candidate list is empty.")
            return {"success": True, "ranked_results": []}

        q_content = req.query_vector
        q_color = req.query_color_vector

        # 1. Prepare Data for Batch Processing
        print("   [1/3] Preparing candidate data...")
        c_ids = []
        c_content_list = []
        c_color_list = []
        
        for item in req.candidates:
            # Only consider candidates with valid content vectors
            if item.vector and len(item.vector) > 0:
                c_ids.append(item.id)
                c_content_list.append(item.vector)
                
                # Handle missing color vectors (legacy data support)
                # Fill with zero vector if missing, so color score becomes 0 effectively
                if item.color_vector and len(item.color_vector) > 0:
                    c_color_list.append(item.color_vector)
                else:
                    c_color_list.append([0.0] * 512)

        if not c_ids:
             print("   ⚠️ No valid candidates found (missing content vectors).")
             return {"success": True, "ranked_results": []}
        
        print(f"   ✅ {len(c_ids)} valid candidates prepared.")

        # 2. Compute Similarities (Cosine Similarity)
        print("   [2/3] Computing Cosine Similarity...")
        
        # Content Similarity
        semantic_scores = util.cos_sim(q_content, c_content_list)[0]
        print(f"      - Content scores calculated")

        # Color Similarity
        if q_color and len(q_color) > 0:
            color_scores = util.cos_sim(q_color, c_color_list)[0]
            print(f"      - Color scores calculated")
        else:
            # Fallback if query image somehow doesn't have color info
            color_scores = [0.0] * len(c_ids)
            print(f"      ⚠️ Query missing color vector, defaulting color scores to 0")

        # 3. Combine Scores and Rank
        print("   [3/3] Fusing scores and ranking...")
        results = []
        
        # WEIGHTS: Adjust these to tune the importance of Content vs. Color
        W_CONTENT = 0.6
        W_COLOR = 0.4
        
        # THRESHOLD: Minimum similarity score to be considered a "match"
        THRESHOLD = 0.35 

        for i in range(len(c_ids)):
            s_score = float(semantic_scores[i])
            c_score = float(color_scores[i])
            
            # Hybrid Score Formula
            final_score = (s_score * W_CONTENT) + (c_score * W_COLOR)
            
            # Debug log for first few items
            if i < 3:
                 print(f"      -> ID: {c_ids[i][:5]}... | Content: {s_score:.2f} | Color: {c_score:.2f} | Final: {final_score:.2f}")
            
            # Filtering
            if final_score > THRESHOLD:
                results.append({
                    "id": c_ids[i],
                    "score": final_score
                })

        # Sort descending by score
        results.sort(key=lambda x: x['score'], reverse=True)
        
        # Return Top 20
        top_results = results[:20]

        total_time = time.time() - start_time
        print(f"✨ [RANK] Ranking complete in {total_time:.2f}s. Found {len(results)} matches (> {THRESHOLD*100}%), returning top {len(top_results)}.\n")
        
        return {
            "success": True,
            "ranked_results": top_results
        }

    except Exception as e:
        print(f"❌ [ERROR] AI Rank Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)