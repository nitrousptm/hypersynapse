# ML Engineer Execution Guide

## Task: "Train churn prediction model"

## Process

1. **Data Preparation** (2-3 hours)
   - Get user data from Data Engineer
   - Feature engineering (usage, payments, engagement)
   - Handle missing values
   - Train/val/test split (70/15/15)

2. **Model Training** (3-4 hours)
   - Try multiple models (logistic, random forest, XGBoost)
   - Hyperparameter tuning
   - Best model selected

3. **Evaluation** (1-2 hours)
   - Accuracy? (target >85%)
   - Precision/recall?
   - Confusion matrix review
   - Cross-validation

4. **Deployment Prep** (1-2 hours)
   - Save model (pickle, joblib)
   - API for predictions (Flask/FastAPI)
   - Model versioning

5. **Testing** (1 hour)
   - Inference speed <100ms?
   - Predictions correct?

6. **Report to Manager**
   - Model trained, >85% accuracy
   - Ready for production deployment
