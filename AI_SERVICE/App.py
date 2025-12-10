import uvicorn
import requests
from io import BytesIO
from typing import List, Optional
import time # Thêm thư viện time để đo thời gian

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
from sentence_transformers import SentenceTransformer, util
import numpy as np
import cv2 
from sklearn.cluster import KMeans
app = FastAPI()
# 1. LOAD MODEL CLIP (Ưu tiên model L-14)
print("⏳ [INIT] Đang tải model AI...")
start_time = time.time()
try:
    # Model lớn, hiểu ngữ cảnh tốt hơn
    model = SentenceTransformer('clip-ViT-L-14') 
    print(f"✅ [INIT] Đã tải model CLIP ViT-L-14 (Thời gian: {time.time() - start_time:.2f}s)")
except:
    # Model dự phòng nhẹ hơn
    print("⚠️ [INIT] Không tải được bản L-14, chuyển sang bản B-32")
    model = SentenceTransformer('clip-ViT-B-32')
    print(f"✅ [INIT] Đã tải model CLIP ViT-B-32 (Thời gian: {time.time() - start_time:.2f}s)")
print("✅ [INIT] AI Service đã sẵn sàng hoạt động trên cổng 8000!")
# 2. DATA MODELS
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
# 3. HELPER FUNCTIONS
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
        print(f"❌ [ERROR] Lỗi tính color vector: {e}")
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
# 4. API ENDPOINTS
@app.post("/analyze")
async def analyze_image(req: ImageRequest):
    print(f"\n🔍 [ANALYZE] Nhận yêu cầu phân tích ảnh: {req.image_url}")
    start_time = time.time()
    try:
        # 1. Tải ảnh
        print("   [1/4] Đang tải ảnh từ URL...")
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(req.image_url, headers=headers, timeout=10)
        if response.status_code != 200:
             print("   ⚠️ Tải ảnh thất bại, thử lại không header...")
             response = requests.get(req.image_url, timeout=10)
        img = Image.open(BytesIO(response.content)).convert("RGB")
        print(f"   ✅ Tải ảnh thành công (Kích thước: {img.size})")
        # 2. CLIP Vector (Nội dung)
        print("   [2/4] Đang tính vector nội dung (CLIP)...")
        clip_vector = model.encode(img).tolist()
        print(f"   ✅ Đã tính vector CLIP (Độ dài: {len(clip_vector)})")
        # 3. Color Vector (Màu sắc)
        print("   [3/4] Đang tính vector màu sắc (Histogram)...")
        color_vector = get_color_vector(img)
        print(f"   ✅ Đã tính vector màu sắc (Độ dài: {len(color_vector)})")
        # 4. Palette (Bảng màu hiển thị)
        print("   [4/4] Đang trích xuất bảng màu chủ đạo...")
        palette = extract_color_palette(img, 5)
        print(f"   ✅ Bảng màu: {palette}")
        total_time = time.time() - start_time
        print(f"✨ [ANALYZE] Hoàn tất phân tích trong {total_time:.2f}s\n")
        return {
            "success": True,
            "vector": clip_vector,
            "color_vector": color_vector,
            "palette": palette,
            "dominant_color": palette[0] if palette else "#000000"
        }
    except Exception as e:
        print(f"❌ [ERROR] Lỗi AI Analyze: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/rank")
async def rank_similarity(req: RankingRequest):
    print(f"\n🏆 [RANK] Nhận yêu cầu xếp hạng cho {len(req.candidates)} ứng viên")
    start_time = time.time()
    try:
        if not req.candidates:
            print("   ⚠️ Danh sách ứng viên trống.")
            return {"success": True, "ranked_results": []}
        q_content = req.query_vector
        q_color = req.query_color_vector
        # Tách danh sách để tính toán nhanh hơn
        print("   [1/3] Chuẩn bị dữ liệu ứng viên...")
        c_ids = []
        c_content_list = []
        c_color_list = []
        for item in req.candidates:
            if item.vector and len(item.vector) > 0:
                c_ids.append(item.id)
                c_content_list.append(item.vector)
                # Nếu DB cũ chưa có color_vector thì điền vector 0
                c_color_list.append(item.color_vector if (item.color_vector and len(item.color_vector) > 0) else [0]*512)
        if not c_ids:
             print("   ⚠️ Không có ứng viên hợp lệ (thiếu vector nội dung).")
             return {"success": True, "ranked_results": []}
        print(f"   ✅ Đã chuẩn bị {len(c_ids)} ứng viên hợp lệ.")
        # Tính toán Cosine Similarity
        print("   [2/3] Tính toán độ tương đồng (Cosine Similarity)...")
        semantic_scores = util.cos_sim(q_content, c_content_list)[0]
        print(f"      - Đã tính điểm nội dung (Semantic scores)")
        # Nếu query có màu thì mới tính điểm màu
        if q_color and len(q_color) > 0:
            color_scores = util.cos_sim(q_color, c_color_list)[0]
            print(f"      - Đã tính điểm màu sắc (Color scores)")
        else:
            color_scores = [0] * len(c_ids)
            print(f"      ⚠️ Query không có vector màu, điểm màu = 0")
        # Kết hợp điểm số
        print("   [3/3] Kết hợp điểm số và xếp hạng...")
        results = []
        # TRỌNG SỐ: 60% Nội dung + 40% Màu sắc
        W_CONTENT = 0.6
        W_COLOR = 0.4
        THRESHOLD = 0.35 # Ngưỡng lọc 35%
        for i in range(len(c_ids)):
            s_score = float(semantic_scores[i])
            c_score = float(color_scores[i])
            
            final_score = (s_score * W_CONTENT) + (c_score * W_COLOR)
            # In thử vài kết quả đầu tiên để kiểm tra
            if i < 3:
                 print(f"      -> ID: {c_ids[i][:5]}... | Content: {s_score:.2f} | Color: {c_score:.2f} | Final: {final_score:.2f}")
            # Ngưỡng lọc
            if final_score > THRESHOLD:
                results.append({
                    "id": c_ids[i],
                    "score": final_score
                })
        # Sắp xếp giảm dần
        results.sort(key=lambda x: x['score'], reverse=True)
        top_results = results[:20] # Top 20

        total_time = time.time() - start_time
        print(f"✨ [RANK] Hoàn tất xếp hạng trong {total_time:.2f}s. Tìm thấy {len(results)} kết quả phù hợp (> {THRESHOLD*100}%), trả về top {len(top_results)}.\n")
        return {
            "success": True,
            "ranked_results": top_results
        }
    except Exception as e:
        print(f"❌ [ERROR] Lỗi AI Rank: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)