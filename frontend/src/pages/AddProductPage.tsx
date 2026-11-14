import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AudioRecorder } from '../components/AudioRecorder';
import { apiRequest } from '../api/client';
import { ProductCreateResponse, UploadImageResponse, UploadAudioResponse, ProcessProductResponse, ProcessingStatusData, ProductDetail } from '../types';
import { Camera, Upload, ArrowRight, Sparkles, CheckCircle2, RefreshCw, AlertCircle, IndianRupee } from 'lucide-react';

interface AddProductPageProps {
  onComplete: (productId: string) => void;
  onCancel: () => void;
}

export const AddProductPage: React.FC<AddProductPageProps> = ({ onComplete, onCancel }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'upload' | 'processing' | 'done'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusData | null>(null);
  const [completedProduct, setCompletedProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleStartPipeline = async () => {
    if (!imageFile) {
      setError('Please select or capture a product photo first.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // 1. Create product draft
      const draft = await apiRequest<ProductCreateResponse>('/products', { method: 'POST' });
      const productId = draft.product_id;

      // 2. Upload image
      const formDataImage = new FormData();
      formDataImage.append('file', imageFile);
      await apiRequest<UploadImageResponse>(`/products/${productId}/image`, {
        method: 'POST',
        body: formDataImage,
      });

      // 3. Upload audio if present
      if (audioBlob) {
        const formDataAudio = new FormData();
        formDataAudio.append('file', audioBlob, 'voice_note.mp3');
        await apiRequest<UploadAudioResponse>(`/products/${productId}/audio`, {
          method: 'POST',
          body: formDataAudio,
        });
      }

      // 4. Trigger processing
      await apiRequest<ProcessProductResponse>(`/products/${productId}/process`, {
        method: 'POST',
        body: JSON.stringify({ transcript: voiceTranscript }),
      });

      setStep('processing');
      pollProcessingStatus(productId);
    } catch (err: any) {
      setError(err.message || 'Failed to start AI cataloging pipeline.');
      setLoading(false);
    }
  };

  const pollProcessingStatus = (productId: string) => {
    const interval = setInterval(async () => {
      try {
        const statusData = await apiRequest<ProcessingStatusData>(`/products/${productId}/processing-status`);
        setProcessingStatus(statusData);

        if (statusData.status === 'READY' || statusData.status === 'PUBLISHED' || statusData.step === 'done') {
          clearInterval(interval);
          const fullProduct = await apiRequest<ProductDetail>(`/products/${productId}`);
          setCompletedProduct(fullProduct);
          setStep('done');
          setLoading(false);
        } else if (statusData.status === 'FAILED') {
          clearInterval(interval);
          setError('AI Pipeline processing failed. Please try again.');
          setStep('upload');
          setLoading(false);
        }
      } catch (err: any) {
        // If poll fails briefly, retry
      }
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-heritage-sand p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-heritage-sand/60 pb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-heritage-ivory text-heritage-terracotta text-xs font-bold border border-heritage-sand">
            <Sparkles className="w-4 h-4 text-heritage-gold" /> Smart AI Cataloguing &amp; Pricing
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-heritage-navy">{t.addProduct}</h1>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
            Take a photo and speak a voice note — our AI will generate a complete catalog description, market price, and find matching buyers!
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-rose-800">{error}</p>
          </div>
        )}

        {/* STEP 1: Upload Photo & Voice */}
        {step === 'upload' && (
          <div className="space-y-8">
            {/* Step 1: Photo Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-bold font-serif text-heritage-navy flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-heritage-navy text-white flex items-center justify-center text-xs font-bold font-sans">1</span>
                {t.photoStep}
              </label>

              {!imagePreview ? (
                <label className="border-2 border-dashed border-heritage-sand hover:border-heritage-gold bg-heritage-ivory hover:bg-stone-50 p-8 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all">
                  <div className="w-16 h-16 rounded-full bg-heritage-navy text-heritage-gold flex items-center justify-center shadow-md">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-heritage-navy block">Tap to select photo or take picture</span>
                    <span className="text-xs text-stone-500">JPEG, PNG, WEBP up to 10MB</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-heritage-sand max-h-64 bg-heritage-ivory flex items-center justify-center">
                  <img src={imagePreview} alt="Product preview" className="max-h-64 object-contain" />
                  <label className="absolute bottom-3 right-3 bg-heritage-navy/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 hover:bg-heritage-navy shadow-md">
                    <RefreshCw className="w-3.5 h-3.5 text-heritage-gold" /> Change Photo
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Step 2: Voice Note */}
            <div className="space-y-3">
              <label className="block text-sm font-bold font-serif text-heritage-navy flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-heritage-navy text-white flex items-center justify-center text-xs font-bold font-sans">2</span>
                {t.voiceStep}
              </label>
              <AudioRecorder
                onAudioReady={(blob) => setAudioBlob(blob)}
                onTranscriptReady={setVoiceTranscript}
              />
              {voiceTranscript && (
                <div className="bg-heritage-ivory border border-heritage-sand rounded-xl p-4 space-y-2 shadow-sm">
                  <label htmlFor="voice-transcript" className="text-sm font-bold font-serif text-heritage-navy">
                    Voice Note Transcript (आवाज़ से विवरण)
                  </label>
                  <textarea
                    id="voice-transcript"
                    value={voiceTranscript}
                    onChange={(event) => setVoiceTranscript(event.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-heritage-sand bg-white text-sm text-heritage-navy focus:border-heritage-gold outline-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-heritage-sand/60">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-3 text-stone-500 font-bold text-sm hover:text-heritage-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || !imageFile}
                onClick={handleStartPipeline}
                className="btn btn-primary text-sm py-3.5 px-7 disabled:opacity-50"
              >
                <span>{loading ? 'Uploading...' : 'Generate AI Catalogue'}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: AI Pipeline Polling Progress */}
        {step === 'processing' && (
          <div className="text-center py-12 space-y-6">
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-heritage-ivory text-heritage-terracotta border border-heritage-sand">
              <Sparkles className="w-12 h-12 animate-bounce text-heritage-gold" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black font-serif text-heritage-navy">AI Orchestration Pipeline Running</h2>
              <p className="text-xs text-stone-500">Processing computer vision, speech transcription, pricing matrix &amp; buyer matching...</p>
            </div>

            {/* Progress bar */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="h-4 w-full bg-heritage-ivory rounded-full overflow-hidden p-0.5 border border-heritage-sand">
                <div
                  className="h-full bg-gradient-to-r from-heritage-terracotta to-heritage-gold rounded-full transition-all duration-500"
                  style={{ width: `${processingStatus?.progress_percent || 25}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-heritage-navy">
                <span className="capitalize">{processingStatus?.step?.replace(/_/g, ' ') || 'initializing'}</span>
                <span>{processingStatus?.progress_percent || 25}%</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Complete Results & Summary */}
        {step === 'done' && completedProduct && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold font-serif text-emerald-900 text-base">AI Cataloguing Complete!</h3>
                <p className="text-xs text-emerald-700">Product successfully catalogued &amp; ready for buyers.</p>
              </div>
            </div>

            {/* Catalogue Details */}
            <div className="bg-heritage-ivory p-6 rounded-2xl border border-heritage-sand space-y-4">
              <h3 className="text-lg font-black font-serif text-heritage-navy">{completedProduct.catalogue?.name}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{completedProduct.catalogue?.description}</p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 bg-white text-heritage-navy font-bold text-xs rounded-full border border-heritage-sand shadow-sm">
                  Craft: {completedProduct.catalogue?.craft}
                </span>
                <span className="px-3 py-1 bg-white text-heritage-navy font-bold text-xs rounded-full border border-heritage-sand shadow-sm">
                  Material: {completedProduct.catalogue?.material}
                </span>
              </div>
            </div>

            {/* Pricing Explanation Card */}
            <div className="bg-white p-6 rounded-2xl border border-heritage-sand shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t.suggestedPrice}</span>
                <div className="flex items-center text-2xl font-black font-serif text-heritage-navy">
                  <IndianRupee className="w-6 h-6 text-heritage-gold" />
                  <span>
                    {completedProduct.price?.suggested_price.toLocaleString('en-IN') ||
                     completedProduct.pricing?.suggested_price.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 bg-heritage-ivory p-3 rounded-xl border border-heritage-sand italic">
                "{completedProduct.price?.explanation || completedProduct.pricing?.explanation}"
              </p>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => onComplete(completedProduct.product_id || completedProduct.id || '')}
              className="btn btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <span>View Full Product &amp; Buyer Opportunities</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
