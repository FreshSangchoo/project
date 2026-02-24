# import pandas as pd
# from fastapi import FastAPI, Request
# from pydantic import BaseModel
# from sentence_transformers import SentenceTransformer, util
# from tqdm.autonotebook import tqdm, trange
# import os
# import logging
# from transformers import pipeline

# os.environ['CUDA_VISIBLE_DEVICES']='9'
# logging.basicConfig(level=logging.INFO)

# app = FastAPI()
# model = SentenceTransformer("bespin-global/klue-sroberta-base-continue-learning-by-mnr")

# class PopupDTO(BaseModel):
#     popupId: int
#     name: str
#     content: str

# class PopupRequestDto(BaseModel):
#     currentPopupRequest: PopupDTO
#     popupListRequest: list[PopupDTO]

# class ReviewRecommendationDto(BaseModel):
#     popupId: int
#     popupName: str
#     popupContent: str
#     reviewTitle: str
#     reviewContent: str

# class RecommendedPopupRequestDto(BaseModel):
#     popupListRequest: list[PopupDTO]
#     reservedPopupListRequest: list[PopupDTO]
#     reviewDtoListRequest: list[ReviewRecommendationDto]
#     heartedPopupListRequest: list[PopupDTO]
#     categoryListRequest: list[str]

# import re
# def remove_html_tags(text):
#     clean = re.compile('<.*?>')
#     return re.sub(clean, '', text)

# def remove_special_characters(text):
#     return re.sub(r'[^A-Za-z가-힣\s]', '', text)

# korean_stopwords = set(['은', '는', '이', '가', '에', '와', '과', '도', '를', '으로', '로', '의', '하', '한', '하다', '합니다'])

# def remove_stopwords(text, stopwords=korean_stopwords):
#     return ' '.join([word for word in text.split() if word not in stopwords])

# from konlpy.tag import Okt

# okt = Okt()

# def tokenize_and_stem(text):
#     tokens = okt.morphs(text)
#     return ' '.join(tokens)

# def preprocess_text(text):
#     text = remove_html_tags(text)
#     text = remove_special_characters(text)
#     text = tokenize_and_stem(text)
#     text = remove_stopwords(text)
#     return text

# def make_df_popups(popupListRequest):
#     df_popups = pd.DataFrame(
#         [{"popupId": popup.popupId, "name": popup.name, "content": popup.content, "text": preprocess_text(popup.name + " " + popup.content)} for popup in popupListRequest]
#     )
#     return df_popups
    

# @app.post("/similar")
# async def get_similar_popups(request: PopupRequestDto):

#     df_popups = make_df_popups(request.popupListRequest)


#     text_list = df_popups['text'].tolist()
#     text_vectors = model.encode(text_list)

#     current_text = preprocess_text(request.currentPopupRequest.name + " " + request.currentPopupRequest.content)
#     current_vector = model.encode(current_text)

#     similarities = util.cos_sim(current_vector, text_vectors).flatten()

#     similarities_df = pd.DataFrame({
#         'popup_id': df_popups['popupId'],
#         'name': df_popups['name'],
#         'content': df_popups['content'],
#         'similarity': similarities
#     })
#     current_popup_id = request.currentPopupRequest.popupId
#     filtered_similarities_df = similarities_df[similarities_df['popup_id'] != current_popup_id]
#     similar_popups_df = filtered_similarities_df.nlargest(10, 'similarity')

#     similar_popups = [
#         PopupDTO(popupId=int(row['popup_id']), name=row['name'], content=row['content'])
#         for _, row in similar_popups_df.iterrows()
#     ]

#     return similar_popups

# @app.post("/recommendation")
# async def get_recommend_popups(request: RecommendedPopupRequestDto):
#     df_popups = make_df_popups(request.popupListRequest)
#     text_list = df_popups['text'].tolist()
#     text_vectors = model.encode(text_list)

#     user_vectors = []
#     added_popup_ids = set()

#     #     # 리뷰 벡터
#     # if request.reviewDtoListRequest:
#     #     classifier = pipeline("text-classification", model="matthewburke/korean_sentiment")
#     #     review_texts = [
#     #         preprocess_text(review.reviewTitle + " " + review.reviewContent) 
#     #         for review in request.reviewDtoListRequest
#     #     ]
#     #     for idx, review in enumerate(review_texts):
#     #         popup_id = request.reviewDtoListRequest[idx].popupId
#     #         if popup_id not in added_popup_ids:
#     #             preds = classifier(review, return_all_scores=True)
#     #             is_positive = preds[0][1]['score'] > 0.5
#     #             print(is_positive)
#     #             if is_positive:
#     #                 review_vector = model.encode(review)
#     #                 user_vectors.append((review_vector, 1,5))

#     # 좋아요한 팝업 벡터
#     if request.heartedPopupListRequest:
#         hearted_df = make_df_popups(request.heartedPopupListRequest)
#         hearted_vectors = model.encode(hearted_df['text'].tolist())
#         for idx, vector in enumerate(hearted_vectors):
#             popup_id = request.heartedPopupListRequest[idx].popupId
#             if popup_id not in added_popup_ids:
#                 user_vectors.append((vector, 1.0))
#                 added_popup_ids.add(popup_id)

#     # 예약한 팝업 벡터
#     if request.reservedPopupListRequest:
#         reserved_df = make_df_popups(request.reservedPopupListRequest)
#         reserved_vectors = model.encode(reserved_df['text'].tolist())
#         for idx, vector in enumerate(reserved_vectors):
#             popup_id = request.reservedPopupListRequest[idx].popupId
#             if popup_id not in added_popup_ids:
#                 user_vectors.append((vector, 1.2))
#                 added_popup_ids.add(popup_id)

#     # 카테고리 벡터
#     if request.categoryListRequest:
#         category_text = " ".join(request.categoryListRequest)
#         category_vector = model.encode(category_text)
#         user_vectors.append((category_vector, 1.0))

#     print("user_vectors:")
#     for vector, weight in user_vectors:
#         print(f"Vector shape: {vector.shape}, Weight: {weight}")


#     if user_vectors:
#         weighted_sum = sum(weight * vector for vector, weight in user_vectors)
#         total_weight = sum(weight for _, weight in user_vectors)
#         user_profile_vector = weighted_sum / total_weight
#     else:
#         user_profile_vector = text_vectors.mean(axis=0)

#     # print(f"user_profile_vector.shape: {user_profile_vector.shape}")


#     similarities = util.cos_sim(user_profile_vector, text_vectors).flatten()

#     similarities_df = pd.DataFrame({
#         'popup_id': df_popups['popupId'],
#         'name': df_popups['name'],
#         'content': df_popups['content'],
#         'similarity': similarities
#     })

#     visited_popup_ids = set([popup.popupId for popup in request.reservedPopupListRequest])
#     filtered_similarities_df = similarities_df[~similarities_df['popup_id'].isin(visited_popup_ids)]

#     similar_popups_df = filtered_similarities_df.nlargest(10, 'similarity')

#     similar_popups = [
#         PopupDTO(popupId=int(row['popup_id']), name=row['name'], content=row['content'])
#         for _, row in similar_popups_df.iterrows()
#     ]

#     print(added_popup_ids)
#     return similar_popups



# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=9323)
