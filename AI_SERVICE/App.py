import uvicorn
import requests
from io import BytesIO
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
from sentence_transformers import SentenceTransformer, util
import numpy as np
import cv2 
from sklearn.cluster import KMeans

app = FastAPI()

# ==========================================
# 1. LOAD MODEL CLIP (Ưu tiên model L-14)
# ==========================================
print("⏳ Đang tải model AI...")
try:
    # Model lớn, hiểu ngữ cảnh tốt hơn
    model = SentenceTransformer('clip-ViT-L-14') 
    print("✅ Đã tải model CLIP ViT-L-14")
except:
    # Model dự phòng nhẹ hơn
    print("⚠️ Không tải được bản L-14, chuyển sang bản B-32")
    model = SentenceTransformer('clip-ViT-B-32')
print("✅ AI Service đã sẵn sàng hoạt động!")

# ==========================================
# 2. DATA MODELS
# ==========================================
class ImageRequest(BaseModel):
    image_url: str

class CandidateItem(BaseModel):
    id: str
    vector: List[float]       # Vector nội dung (CLIP)
    color_vector: Optional[List[float]] = None # Vector màu sắc (Histogram)

class RankingRequest(BaseModel):
    query_vector: List[float]
    query_color_vector: List[float]
    candidates: List[CandidateItem]

# ==========================================
# 3. HELPER FUNCTIONS
# ==========================================

def get_color_vector(pil_img):
    """
    Tính Histogram màu sắc trong không gian HSV (512 chiều)
    """
    try:
        # Convert PIL -> OpenCV (RGB -> HSV)
        img_cv = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2HSV)
        
        # Tính Histogram: 8 bins cho H, S, V -> 8*8*8 = 512
        hist = cv2.calcHist([img_cv], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
        
        # Chuẩn hóa
        cv2.normalize(hist, hist)
        return hist.flatten().tolist()
    except Exception as e:
        print(f"Lỗi tính color vector: {e}")
        return [0.0] * 512

def extract_color_palette(pil_img, num_colors=5):
    """
    Trích xuất 5 màu chủ đạo (Hex code)
    """
    try:
        img = pil_img.copy().convert("RGB")
        img = img.resize((100, 100)) # Resize nhỏ để chạy nhanh
        ar = np.asarray(img)
        ar = ar.reshape(np.product(ar.shape[:2]), ar.shape[2]).astype(float)

        kmeans = KMeans(n_clusters=num_colors, n_init=10)
        kmeans.fit(ar)
        colors = kmeans.cluster_centers_
        
        hex_colors = []
        for color in colors:
            hex_colors.append('#%02x%02x%02x' % (int(color[0]), int(color[1]), int(color[2])))
        return hex_colors
    except:
        return ["#000000"]

# ==========================================
# 4. API ENDPOINTS
# ==========================================

@app.post("/analyze")
async def analyze_image(req: ImageRequest):
    try:
        # Tải ảnh với User-Agent giả lập để tránh bị chặn
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(req.image_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
             # Fallback: Thử tải lại không header (cho localhost)
             response = requests.get(req.image_url, timeout=10)

        img = Image.open(BytesIO(response.content)).convert("RGB")

        # 1. CLIP Vector (Nội dung)
        clip_vector = model.encode(img).tolist()

        # 2. Color Vector (Màu sắc)
        color_vector = get_color_vector(img)

        # 3. Palette (Bảng màu hiển thị)
        palette = extract_color_palette(img, 5)

        return {
            "success": True,
            "vector": clip_vector,
            "color_vector": color_vector,
            "palette": palette,
            "dominant_color": palette[0] if palette else "#000000"
        }
    except Exception as e:
        print(f"Lỗi AI Analyze: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rank")
async def rank_similarity(req: RankingRequest):
    try:
        if not req.candidates:
            return {"success": True, "ranked_results": []}

        q_content = req.query_vector
        q_color = req.query_color_vector

        # Tách danh sách để tính toán nhanh hơn
        c_ids = []
        c_content_list = []
        c_color_list = []

        for item in req.candidates:
            if item.vector and len(item.vector) > 0:
                c_ids.append(item.id)
                c_content_list.append(item.vector)
                # Nếu DB cũ chưa có color_vector thì điền vector 0
                c_color_list.append(item.color_vector if (item.color_vector and len(item.color_vector) > 0) else [0]*512)

        if not c_ids: return {"success": True, "ranked_results": []}

        # Tính toán Cosine Similarity
        semantic_scores = util.cos_sim(q_content, c_content_list)[0]
        
        # Nếu query có màu thì mới tính điểm màu
        if q_color and len(q_color) > 0:
            color_scores = util.cos_sim(q_color, c_color_list)[0]
        else:
            color_scores = [0] * len(c_ids)

        results = []
        # TRỌNG SỐ: 60% Nội dung + 40% Màu sắc
        W_CONTENT = 0.6
        W_COLOR = 0.4

        for i in range(len(c_ids)):
            s_score = float(semantic_scores[i])
            c_score = float(color_scores[i])
            
            final_score = (s_score * W_CONTENT) + (c_score * W_COLOR)

            # Ngưỡng lọc: Chỉ lấy nếu giống > 35%
            if final_score > 0.35:
                results.append({
                    "id": c_ids[i],
                    "score": final_score
                })

        results.sort(key=lambda x: x['score'], reverse=True)

        return {
            "success": True,
            "ranked_results": results[:20] # Top 20
        }

    except Exception as e:
        print(f"Lỗi AI Rank: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)