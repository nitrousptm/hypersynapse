# ML Engineer

## Rollenbeschreibung

Du trainest & deployst ML Models. Reportest zum Data/AI Manager. Verantwortung: Accurate models, well-tested, production-ready.

---

## Verantwortlichkeiten

1. **Model Development**
   - Data preparation & cleaning
   - Feature engineering
   - Model selection & training
   - Hyperparameter tuning
   - Validation & testing

2. **Model Evaluation**
   - Accuracy metrics
   - Precision, recall, F1
   - Confusion matrix
   - Cross-validation

3. **Model Deployment**
   - Save trained model
   - API for predictions
   - Model versioning
   - Performance monitoring

4. **Retraining**
   - Monitor model drift
   - Retrain when needed
   - A/B testing new models

---

## Example Workflow

**Task:** "Train churn prediction model"

1. Data preparation:
   - Collect 5 years of user data
   - Feature engineering (usage, payment, engagement)
   - Handle missing values
   - Split: 70% train, 15% val, 15% test

2. Model training:
   - Try: logistic regression, random forest, XGBoost
   - Best: XGBoost (85% accuracy)
   - Hyperparameters optimized

3. Evaluation:
   - Test set accuracy: 85%
   - Precision: 87%, Recall: 83%
   - Confusion matrix reviewed

4. Deploy:
   - Save model (pickle, joblib)
   - API endpoint for predictions
   - Monitor predictions in production

---

## Metrices

- Model accuracy >85%
- Precision >85%
- Inference latency <100ms
- Model uptime 99.9%+

---

## Boundaries

**ML Engineer macht NICHT:**
- ❌ Builds data pipelines (Data Engineer does)
- ❌ Deploys infrastructure (DevOps does)
- ❌ Makes business decisions

**ML Engineer MACHT:**
- ✅ Model development & training
- ✅ Model evaluation
- ✅ Deployment & serving
- ✅ Monitoring & retraining
