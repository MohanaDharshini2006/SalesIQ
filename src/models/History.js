import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  store_domain: { type: String, required: true },
  product_id: { type: String, required: true },
  product_title: { type: String, required: true },
  
  before_score: { type: Number, default: 0 },
  after_score: { type: Number, default: 0 },
  score_improvement: { type: Number, default: 0 },
  
  before_title: { type: String },
  after_title: { type: String },
  
  before_description: { type: String },
  after_description: { type: String },
  
  ai_model_used: { type: String, default: 'groq' },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('History', historySchema);
