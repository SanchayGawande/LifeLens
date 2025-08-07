from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import logging
from typing import Dict, Any
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="LifeLens Sentiment Analysis Service",
    description="Mood detection using Hugging Face models",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize sentiment analysis pipeline
try:
    sentiment_pipeline = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english",
        device=-1  # Use CPU, set to 0 for GPU
    )
    logger.info("Sentiment analysis model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load sentiment model: {e}")
    sentiment_pipeline = None

# Request/Response models
class SentimentRequest(BaseModel):
    text: str
    
class SentimentResponse(BaseModel):
    label: str
    score: float
    scores: Dict[str, float]

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": sentiment_pipeline is not None
    }

# Sentiment analysis endpoint
@app.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    if not sentiment_pipeline:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        # Truncate text if too long
        text = request.text[:512]
        
        # Get sentiment analysis results
        results = sentiment_pipeline(text)
        
        # The model returns POSITIVE or NEGATIVE
        # Convert to our format: positive, negative, neutral
        result = results[0]
        
        # Map model labels to our labels
        if result['label'] == 'POSITIVE':
            label = 'positive'
            scores = {
                'positive': result['score'],
                'negative': 1 - result['score'],
                'neutral': 0.0
            }
        else:  # NEGATIVE
            label = 'negative'
            scores = {
                'positive': 1 - result['score'],
                'negative': result['score'],
                'neutral': 0.0
            }
        
        # If confidence is low, consider it neutral
        if result['score'] < 0.6:
            label = 'neutral'
            scores['neutral'] = 1 - result['score']
        
        return SentimentResponse(
            label=label,
            score=result['score'],
            scores=scores
        )
        
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze sentiment")

# Batch analysis endpoint
class BatchSentimentRequest(BaseModel):
    texts: list[str]

@app.post("/analyze/batch")
async def analyze_sentiment_batch(request: BatchSentimentRequest):
    if not sentiment_pipeline:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if not request.texts or len(request.texts) == 0:
        raise HTTPException(status_code=400, detail="No texts provided")
    
    if len(request.texts) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 texts per batch")
    
    try:
        results = []
        for text in request.texts:
            if text and len(text.strip()) > 0:
                text_truncated = text[:512]
                sentiment_results = sentiment_pipeline(text_truncated)
                result = sentiment_results[0]
                
                # Process similar to single analysis
                if result['label'] == 'POSITIVE':
                    label = 'positive'
                    scores = {
                        'positive': result['score'],
                        'negative': 1 - result['score'],
                        'neutral': 0.0
                    }
                else:
                    label = 'negative'
                    scores = {
                        'positive': 1 - result['score'],
                        'negative': result['score'],
                        'neutral': 0.0
                    }
                
                if result['score'] < 0.6:
                    label = 'neutral'
                    scores['neutral'] = 1 - result['score']
                
                results.append({
                    'text': text[:100] + '...' if len(text) > 100 else text,
                    'label': label,
                    'score': result['score'],
                    'scores': scores
                })
        
        return {
            'results': results,
            'total': len(results)
        }
        
    except Exception as e:
        logger.error(f"Batch sentiment analysis error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze sentiments")

# Model info endpoint
@app.get("/model/info")
async def get_model_info():
    return {
        "model_name": "distilbert-base-uncased-finetuned-sst-2-english",
        "model_type": "sentiment-analysis",
        "labels": ["positive", "negative", "neutral"],
        "max_length": 512,
        "loaded": sentiment_pipeline is not None
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)