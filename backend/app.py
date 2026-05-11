"""
PneumoScan AI — FastAPI backend pour détection de pneumonie
"""
from __future__ import annotations

import io
import os
from typing import Optional
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from PIL import Image
import tensorflow as tf

IMG_SIZE = (224, 224)
CLASS_NAMES = ["NORMAL", "PNEUMONIA"]

app = FastAPI(title="PneumoScan AI - Détection de Pneumonie")

# CORS pour permettre l'accès depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger le modèle
model = None

def load_model():
    """Charge le modèle DenseNet121 entraîné"""
    global model
    if model is not None:
        return model
    
    # Cherche le modèle dans différents formats
    model_paths = [
        "densenet_model.keras",
        "best_model.keras", 
        "model.keras",
        "model.h5"
    ]
    
    for path in model_paths:
        if os.path.exists(path):
            model = tf.keras.models.load_model(path)
            print(f"[PneumoScan] Modèle chargé : {path}")
            return model
    
    raise FileNotFoundError("Aucun modèle trouvé. Placez 'densenet_model.keras' dans le dossier.")

def preprocess_image(image_bytes):
    """Prétraite l'image pour le modèle"""
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    image = image.resize(IMG_SIZE)
    image_array = np.array(image) / 255.0  # Normalisation
    image_array = np.expand_dims(image_array, axis=0)  # Batch dimension
    return image_array

@app.on_event("startup")
async def startup_event():
    load_model()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Endpoint de prédiction
    Retourne: { "prediction": "PNEUMONIA" | "NORMAL", "confidence": float }
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Le fichier doit être une image")
    
    try:
        contents = await file.read()
        image_array = preprocess_image(contents)
        
        # Prédiction
        prediction = model.predict(image_array, verbose=0)[0][0]
        
        # Interprétation (sigmoid: >0.5 = PNEUMONIA)
        is_pneumonia = prediction > 0.5
        class_name = "PNEUMONIA" if is_pneumonia else "NORMAL"
        confidence = float(prediction if is_pneumonia else 1 - prediction)
        
        return {
            "prediction": class_name,
            "confidence": round(confidence * 100, 2),
            "raw_score": float(prediction)
        }
        
    except Exception as e:
        raise HTTPException(500, f"Erreur de prédiction: {str(e)}")

@app.get("/", response_class=HTMLResponse)
async def home():
    """Sert l'interface utilisateur"""
    html_content = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PneumoScan AI - Détection de Pneumonie</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .container {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                padding: 40px;
                max-width: 600px;
                width: 100%;
                text-align: center;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
            }
            
            h1 {
                color: #333;
                margin-bottom: 10px;
                font-size: 28px;
            }
            
            .subtitle {
                color: #666;
                margin-bottom: 30px;
            }
            
            .upload-area {
                border: 3px dashed #667eea;
                border-radius: 15px;
                padding: 40px 20px;
                margin-bottom: 20px;
                cursor: pointer;
                transition: all 0.3s;
                background: #f8f9ff;
            }
            
            .upload-area:hover {
                border-color: #764ba2;
                background: #f0f2ff;
            }
            
            .upload-area.dragover {
                border-color: #764ba2;
                background: #e8ebff;
                transform: scale(1.02);
            }
            
            #fileInput { display: none; }
            
            .upload-icon { font-size: 48px; margin-bottom: 10px; }
            .upload-text { color: #667eea; font-weight: 600; }
            .upload-hint { color: #999; font-size: 14px; margin-top: 5px; }
            
            #preview {
                max-width: 100%;
                max-height: 300px;
                border-radius: 10px;
                margin: 20px 0;
                display: none;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .btn {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 15px 40px;
                border-radius: 30px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                margin: 10px;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
            }
            
            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            .btn-secondary {
                background: #f0f0f0;
                color: #333;
            }
            
            #result {
                margin-top: 25px;
                padding: 20px;
                border-radius: 15px;
                display: none;
                animation: fadeIn 0.5s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .result-normal {
                background: #d4edda;
                border: 2px solid #28a745;
                color: #155724;
            }
            
            .result-pneumonia {
                background: #f8d7da;
                border: 2px solid #dc3545;
                color: #721c24;
            }
            
            .result-icon { font-size: 48px; margin-bottom: 10px; }
            .result-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .result-confidence { font-size: 18px; margin-bottom: 5px; }
            .result-advice { font-size: 14px; margin-top: 10px; opacity: 0.9; }
            
            .loading {
                display: none;
                margin: 20px 0;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .info-box {
                background: #e7f3ff;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin-top: 20px;
                border-radius: 5px;
                text-align: left;
                font-size: 14px;
                color: #555;
            }
            
            .error {
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 10px;
                margin-top: 15px;
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🫁</div>
            <h1>PneumoScan AI</h1>
            <p class="subtitle">Détection intelligente de la pneumonie par radiographie</p>
            
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📤</div>
                <div class="upload-text">Glissez-déposez une image ou cliquez pour sélectionner</div>
                <div class="upload-hint">Formats acceptés : JPG, PNG, JPEG</div>
                <input type="file" id="fileInput" accept="image/*">
            </div>
            
            <img id="preview" alt="Aperçu de la radiographie">
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p style="margin-top: 10px; color: #666;">Analyse en cours...</p>
            </div>
            
            <div style="display: flex; justify-content: center; gap: 10px;">
                <button class="btn" id="analyzeBtn" disabled>Analyser l'image</button>
                <button class="btn btn-secondary" id="resetBtn" style="display:none;">Nouvelle analyse</button>
            </div>
            
            <div id="result"></div>
            <div class="error" id="error"></div>
            
            <div class="info-box">
                <strong>ℹ️ Information :</strong> Ce système utilise un modèle d'intelligence artificielle (DenseNet121) entraîné sur des radiographies thoraciques. 
                Il est conçu pour aider à la détection de la pneumonie mais ne remplace pas un avis médical professionnel.
            </div>
        </div>

        <script>
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');
            const preview = document.getElementById('preview');
            const analyzeBtn = document.getElementById('analyzeBtn');
            const resetBtn = document.getElementById('resetBtn');
            const result = document.getElementById('result');
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            
            let selectedFile = null;
            
            // Gestion du clic sur la zone d'upload
            uploadArea.addEventListener('click', () => fileInput.click());
            
            // Gestion du changement de fichier
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                }
            });
            
            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    handleFile(e.dataTransfer.files[0]);
                }
            });
            
            function handleFile(file) {
                if (!file.type.startsWith('image/')) {
                    showError('Veuillez sélectionner une image valide.');
                    return;
                }
                
                selectedFile = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    uploadArea.style.display = 'none';
                    analyzeBtn.disabled = false;
                };
                reader.readAsDataURL(file);
                hideError();
            }
            
            // Analyse de l'image
            analyzeBtn.addEventListener('click', async () => {
                if (!selectedFile) return;
                
                loading.style.display = 'block';
                analyzeBtn.disabled = true;
                result.style.display = 'none';
                hideError();
                
                const formData = new FormData();
                formData.append('file', selectedFile);
                
                try {
                    const response = await fetch('/predict', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Erreur HTTP: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    showResult(data);
                    
                } catch (err) {
                    showError('Erreur lors de l\'analyse : ' + err.message);
                } finally {
                    loading.style.display = 'none';
                }
            });
            
            function showResult(data) {
                const isPneumonia = data.prediction === 'PNEUMONIA';
                const className = isPneumonia ? 'result-pneumonia' : 'result-normal';
                const icon = isPneumonia ? '⚠️' : '✅';
                const title = isPneumonia ? 'PNEUMONIE DÉTECTÉE' : 'RADIOGRAPHIE NORMALE';
                const advice = isPneumonia 
                    ? 'Consultez immédiatement un professionnel de santé pour confirmation et traitement.'
                    : 'Aucun signe de pneumonie détecté. Consultez un médecin en cas de symptômes persistants.';
                
                result.className = className;
                result.innerHTML = `
                    <div class="result-icon">${icon}</div>
                    <div class="result-title">${title}</div>
                    <div class="result-confidence">Confiance : ${data.confidence}%</div>
                    <div class="result-advice">${advice}</div>
                `;
                result.style.display = 'block';
                
                analyzeBtn.style.display = 'none';
                resetBtn.style.display = 'inline-block';
            }
            
            resetBtn.addEventListener('click', () => {
                selectedFile = null;
                preview.style.display = 'none';
                preview.src = '';
                uploadArea.style.display = 'block';
                analyzeBtn.disabled = true;
                analyzeBtn.style.display = 'inline-block';
                resetBtn.style.display = 'none';
                result.style.display = 'none';
                fileInput.value = '';
                hideError();
            });
            
            function showError(msg) {
                error.textContent = msg;
                error.style.display = 'block';
            }
            
            function hideError() {
                error.style.display = 'none';
            }
        </script>
    </body>
    </html>
    """
    return html_content

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)