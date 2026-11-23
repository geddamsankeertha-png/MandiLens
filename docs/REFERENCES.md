# References & Primary Source Attributions

All references listed below correspond directly to frameworks, libraries, datasets, standards, and internal engineering artifacts verified in the **KisanMandi – Mandi Price Predictor** repository.

---

## 1. Frameworks, Runtime & Database Technologies

1. **React Team (Meta Platforms, Inc.)**, *"React 19 Documentation – Components, Hooks, and Client State Management"*, v19.0.1. Available: https://react.dev/
2. **Evan You & Vite Contributors**, *"Vite Next-Generation Frontend Tooling & ESM Dev Middleware"*, v8.3.0. Available: https://vite.dev/
3. **Tailwind Labs**, *"Tailwind CSS v4 Framework Documentation"*, v4.3.3. Available: https://tailwindcss.com/docs
4. **OpenJS Foundation**, *"Express Web Application Framework for Node.js"*, v4.21.2. Available: https://expressjs.com/
5. **Node.js Foundation**, *"Node.js Built-in `node:sqlite` (`DatabaseSync`) & `node:crypto` (`scryptSync`, `timingSafeEqual`) API Documentation"*, Node.js v22 LTS. Available: https://nodejs.org/api/sqlite.html

---

## 2. Machine Learning, Statistics & Time-Series Literature

6. **Pedregosa, F., Varoquaux, G., Gramfort, A., et al.**, *"Scikit-learn: Machine Learning in Python"*, Journal of Machine Learning Research (JMLR), Vol. 12, pp. 2825–2830, 2011 (Referenced for optional `Ridge` and `RandomForestRegressor` API equivalence). Available: https://scikit-learn.org/
7. **McKinney, W.**, *"Data Structures for Statistical Computing in Python (pandas)"*, Proceedings of the 9th Python in Science Conference (SciPy), pp. 56–61, 2010.
8. **Harris, C. R., Millman, K. J., van der Walt, S. J., et al.**, *"Array Programming with NumPy"*, Nature, Vol. 585, pp. 357–362, 2020.
9. **Hoerl, A. E., & Kennard, R. W.**, *"Ridge Regression: Biased Estimation for Nonorthogonal Problems"*, Technometrics, Vol. 12, No. 1, pp. 55–67, 1970 (Basis for $L_2$-regularized Multiple Linear Regression implemented in `ml/ml_engine.py`).
10. **Breiman, L.**, *"Random Forests"*, Machine Learning, Vol. 45, No. 1, pp. 5–32, 2001 (Basis for bagged decision tree regression ensemble implemented in `PurePythonRandomForest` and `RandomForestRegressor`).
11. **Hyndman, R. J., & Athanasopoulos, G.**, *"Forecasting: Principles and Practice (3rd ed.)"*, OTexts, 2021 — Specifically Chapter 3 (Seasonal & Moving-Average Decomposition), Chapter 5 (Time-Series Cross-Validation / Chronological Train–Test Splits & Accuracy Metrics MAE, RMSE, MAPE), and Prediction Intervals. Available: https://otexts.com/fpp3/

---

## 3. Agricultural Market Data & Empirical Context

12. **Ministry of Agriculture & Farmers Welfare, Government of India — Open Government Data (OGD) Platform (`data.gov.in`)**, *"Current Daily Price of Various Commodities from Various Markets (AGMARKNET Mandi Feed)"*, Resource ID: `9ef84268-d588-465a-a308-a864a43d0070`. Available: https://data.gov.in/
13. **Taparia, S.**, *"Empirical Analysis of Indian Agricultural Commodity Markets and Input–Output Cultivation Economics"* (Referenced in `src/types/mandi.ts` and `src/data/mandiData.ts` for crop-group taxonomy, 28 Indian states metadata, and cultivation cost variables).

---

## 4. Security Standards & Cryptography Practices

14. **Jones, M., Bradley, J., & Sakimura, N.**, *"JSON Web Token (JWT)"*, IETF RFC 7519, May 2015 (Implemented strictly with `HS256` verification and `alg: none` rejection in `server/securityMiddleware.ts`).
15. **Percival, C., & Josefsson, S.**, *"The scrypt Password-Based Key Derivation Function"*, IETF RFC 7914, August 2016 (Used via Node's `crypto.scryptSync` with 16-byte random salts in `server/database.ts`).

---

## 5. Internal Project Implementation & Verification Reports

16. `docs/STUDENT_PROJECT_AUDIT.md` — Pre-transformation engineering, security, and dependency baseline audit.
17. `docs/PROJECT_ARCHITECTURE.md` — System architecture, SQLite tables, RBAC policy, and offline configuration specification.
18. `docs/ML_DOCUMENTATION.md` — Machine learning pipeline schema and provenance guidelines.
19. `docs/API_DOCUMENTATION.md` — Complete REST endpoint catalog.
20. `docs/FINAL_QA_REPORT.md` — Independent post-fix functional, security (`9/9` Jest/Node tests), and ML (`7/7` Python `unittest` cases) verification results.
21. `walkthrough.md` — Security review summary and step-by-step verification traces.
