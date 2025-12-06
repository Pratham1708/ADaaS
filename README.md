# ADaaS - Actuarial Dashboard as a Service

A comprehensive AI-powered actuarial analytics platform with FastAPI backend and Next.js frontend, featuring intelligent dataset analysis, multiple visualization types, and advanced statistical modeling capabilities.

## 🌟 Key Features

### 🤖 AI-Powered Intelligence
- **Gemini AI Integration**: Automatic dataset type detection and intelligent column analysis
- **AI-Powered Data Cleaning**: Automatic detection of missing values, outliers, skewness, and data quality issues with intelligent transformation recommendations
- **Natural Language Queries**: Ask questions in plain English and get instant visualizations
- **Smart Recommendations**: AI-suggested visualizations based on data characteristics
- **Automated Insights**: Business insights and data quality assessment

### 📊 Comprehensive Analytics

#### Survival Analysis
- Kaplan-Meier survival curves with confidence intervals
- Nelson-Aalen cumulative hazard estimation
- Life table computations
- Stratified analysis with log-rank tests
- Cox proportional hazards regression

#### ML Survival Models
- Random Survival Forest
- Gradient Boosted Survival
- CoxNet (Penalized Cox)
- Model comparison with concordance indices
- Variable importance analysis

#### Mortality Analytics
- Complete life table calculations (qₓ → lₓ → dₓ → eₓ)
- Parametric model fitting (Gompertz, Makeham)
- Graduation methods (Whittaker-Henderson, Moving Average, Splines)
- Life expectancy analysis
- Mortality rate visualization

#### GLM Pricing Models
- Poisson regression for frequency modeling
- Gamma regression for severity modeling
- Negative Binomial for overdispersed data
- Automatic family detection
- Feature importance and partial dependence plots

#### Time-Series Forecasting
- ARIMA/SARIMA models
- Holt-Winters exponential smoothing
- Prophet forecasting
- Automatic model selection
- Seasonal decomposition

#### Reserving
- Chain-ladder method for claims triangles
- Development factor estimation
- Reserve calculations

### 🎨 Multi-Page Dashboard Architecture (NEW!)
- **Unified Sidebar Navigation**: Seamless navigation between all analysis modules
- **Summary Dashboard**: Overview KPIs, quick actions, and recent jobs
- **Survival Analysis**: Kaplan-Meier curves, life tables, and hazard functions
- **Reserving**: Chain ladder analysis (coming soon)
- **GLM Pricing**: Configure and run pricing models
- **ML Survival Models**: Train and compare advanced survival models
- **Mortality Tables**: Complete actuarial life table analytics
- **AI Insights**: Gemini analysis, NLQ interface, and data quality tools
- **Dataset Workspace**: Comprehensive data profiling and exploration
- **Specialized Result Dashboards**: Detailed GLM and time-series results

### 📊 Dataset Workspace Features (NEW!)
- **Column Profiling**: Detailed statistics for every column
- **Data Quality Scoring**: Multi-dimensional quality assessment
- **Correlation Analysis**: Pearson and Cramér's V correlations
- **Missing Value Analysis**: Heatmap-ready missing value detection
- **Distribution Analysis**: Histogram and box plot data
- **Auto-Generated Data Dictionary**: AI-powered column descriptions
- **Quality Flags**: Automatic detection of outliers, skewness, and data issues

### 📈 Visualization Types
- Bar charts, Line charts, Scatter plots
- Histograms, Pie charts, Boxplots
- **Heatmaps** (NEW!)
- Kaplan-Meier curves
- Survival probability plots
- Interactive Chart.js visualizations

### 📄 Export & Reporting
- **AI-Powered Report Generator**: Comprehensive PDF/DOCX reports
- Includes all visualizations, KPIs, and analysis results
- Professional formatting with executive summaries
- Export charts as images
- Download data as CSV/JSON

### 🔐 Security & Authentication
- Firebase Authentication with Google Sign-In
- Protected routes and secure API endpoints
- Client-side authentication state management

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI + Uvicorn
- **AI/ML**: Google Gemini 1.5 Flash, scikit-survival, statsmodels
- **Analytics**: pandas, numpy, lifelines, prophet, pmdarima
- **Job Queue**: Redis + RQ (async processing)
- **Reporting**: python-docx, reportlab
- **Testing**: pytest

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.x
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Lucide React
- **Auth**: Firebase Authentication
- **HTTP**: axios

### DevOps
- Docker + Docker Compose
- GitHub Actions CI/CD

## 🎨 Design System

### Color Palette
- **Primary (Blue)**: `#3b82f6` - Main brand color, primary actions
- **Secondary (Emerald)**: `#10b981` - Success states, positive actions
- **Accent (Amber)**: `#f59e0b` - Highlights, warnings
- **Danger (Red)**: `#ef4444` - Errors, destructive actions
- **Purple**: `#8b5cf6` - Special features, ML models
- **Indigo**: `#6366f1` - Advanced analytics

### UI Components
- **Cards**: Glass-morphism effects with subtle shadows
- **Buttons**: 5 variants (primary, secondary, outline, ghost, danger)
- **Gradients**: Smooth color transitions for backgrounds and accents
- **Animations**: fadeIn, slideUp, float effects for enhanced UX
- **Typography**: Professional hierarchy with clear visual weight

### Feature Page Structure
Each feature information page includes:
1. **Hero Section**: Icon, title, and brief description
2. **What is it?**: Plain-language explanation for beginners
3. **Key Features/Concepts**: Detailed breakdown with examples
4. **Visual Flow Diagram**: Step-by-step process visualization
5. **How it Works**: Numbered steps with explanations
6. **Use Cases**: Real-world applications with examples
7. **CTA Button**: Direct link to try the feature

## 📁 Project Structure

```
adaas/
├── backend/
│   ├── app/
│   │   ├── main.py                          # FastAPI application
│   │   ├── api/v1/
│   │   │   ├── routes_datasets.py           # Dataset upload/management
│   │   │   └── routes_analysis.py           # Analysis endpoints + NLQ
│   │   ├── services/
│   │   │   ├── gemini_analyzer.py           # AI dataset analysis
│   │   │   ├── nlq_service.py               # Natural language queries (NEW!)
│   │   │   ├── survival_models.py           # Survival analysis
│   │   │   ├── ml_survival.py               # ML survival models
│   │   │   ├── mortality_models.py          # Mortality analytics
│   │   │   ├── glm_models.py                # GLM pricing
│   │   │   ├── time_series.py               # Forecasting
│   │   │   ├── reserving_chainladder.py     # Chain-ladder
│   │   │   └── report_generator.py          # AI report generation
│   │   ├── utils/
│   │   │   ├── job_store.py                 # Job tracking
│   │   │   └── file_storage.py              # File handling
│   │   └── workers/
│   │       └── rq_worker.py                 # Background worker
│   ├── uploaded_files/                      # CSV uploads
│   ├── jobs/                                # Job metadata
│   ├── analysis_results/                    # Results storage
│   ├── tests/                               # Unit tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── pages/
│   │   ├── index.tsx                        # Landing page (redesigned)
│   │   ├── upload.tsx                       # Upload & analysis (beautified)
│   │   ├── login.tsx                        # Authentication (redesigned)
│   │   ├── features/                        # Feature information pages (NEW!)
│   │   │   ├── ai-insights.tsx              # AI Insights explained
│   │   │   ├── survival-analysis.tsx        # Survival analysis guide
│   │   │   ├── dataset-workspace.tsx        # Workspace features
│   │   │   ├── glm-pricing.tsx              # GLM models explained
│   │   │   ├── ml-survival.tsx              # ML survival guide
│   │   │   ├── mortality-tables.tsx         # Mortality tables guide
│   │   │   ├── time-series.tsx              # Forecasting guide
│   │   │   └── reserving.tsx                # Reserving explained
│   │   ├── dashboard/                       # Multi-page dashboard
│   │   │   ├── summary/[dataset_id].tsx     # Overview & KPIs
│   │   │   ├── survival/[dataset_id].tsx    # Survival analysis
│   │   │   ├── reserving/[dataset_id].tsx   # Reserving (coming soon)
│   │   │   ├── glm/[dataset_id].tsx         # GLM configuration
│   │   │   ├── ml-survival/[dataset_id].tsx # ML survival models
│   │   │   ├── mortality/[dataset_id].tsx   # Mortality tables
│   │   │   ├── ai-insights/[dataset_id].tsx # AI analysis & NLQ
│   │   │   └── workspace/[dataset_id].tsx   # Data profiling
│   │   ├── glm-dashboard/[job_id].tsx       # Detailed GLM results
│   │   ├── timeseries-dashboard/[job_id].tsx # Detailed TS results
│   │   └── jobs.tsx                         # Job monitoring
│   ├── components/
│   │   ├── Sidebar.tsx                      # Unified navigation (NEW!)
│   │   ├── DashboardLayout.tsx              # Dashboard wrapper (NEW!)
│   │   ├── NaturalLanguageQuery.tsx         # NLQ interface
│   │   ├── DataQualityCleaning.tsx          # AI data cleaning
│   │   ├── RecommendedChart.tsx             # AI-recommended charts
│   │   ├── KMChart.tsx                      # Survival curves
│   │   ├── ExportReportButton.tsx           # Report export
│   │   ├── NavBar.tsx                       # Top navigation
│   │   └── ProtectedRoute.tsx               # Auth guard
│   ├── contexts/
│   │   └── AuthContext.tsx                  # Firebase auth
│   ├── lib/
│   │   └── firebase.ts                      # Firebase config
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone and navigate to the repository**
   ```bash
   cd e:\ADAAS
   ```

2. **Configure environment variables**
   
   Backend (`backend/.env`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```
   
   Frontend (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Native Development

#### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis

#### Backend Setup

1. **Start Redis**
   ```bash
   docker run -d --name adaas-redis -p 6379:6379 redis:7
   ```

2. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   pip install -r ml_survival_requirements.txt  # For ML survival models
   ```

3. **Configure environment**
   Create `backend/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

4. **Start backend server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **Start RQ worker** (in separate terminal)
   ```bash
   cd backend
   python -m app.workers.rq_worker
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Firebase and API credentials
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access frontend**
   - http://localhost:3000

## 🔑 API Endpoints

### Datasets
- `POST /api/v1/datasets/upload` - Upload CSV dataset
- `GET /api/v1/datasets` - List all datasets
- `POST /api/v1/datasets/analyze-smart/{dataset_id}` - AI-powered analysis
- `GET /api/v1/datasets/{dataset_id}/data-quality` - Analyze data quality
- `POST /api/v1/datasets/{dataset_id}/apply-cleaning` - Apply cleaning transformations
- `GET /api/v1/datasets/survival-analysis/{dataset_id}` - Get survival data
- `GET /api/v1/datasets/{dataset_id}/data` - Get raw dataset

### Dataset Workspace (NEW!)
- `GET /api/v1/datasets/{dataset_id}/profile` - Comprehensive dataset profile
- `GET /api/v1/datasets/{dataset_id}/correlations` - Correlation matrices
- `GET /api/v1/datasets/{dataset_id}/distributions` - Distribution data
- `GET /api/v1/datasets/{dataset_id}/missing-heatmap` - Missing value heatmap
- `GET /api/v1/datasets/{dataset_id}/data-dictionary` - Auto-generated data dictionary

### Analysis
- `POST /api/v1/analysis/survival` - Survival analysis (async)
- `POST /api/v1/analysis/glm` - GLM pricing analysis (async)
- `POST /api/v1/analysis/timeseries` - Time-series forecasting (async)
- `POST /api/v1/analysis/mortality` - Mortality table analysis (sync)
- `POST /api/v1/analysis/chainladder` - Chain-ladder reserving (sync)
- `POST /api/v1/analysis/ml-survival/train` - Train ML survival model (async)
- `POST /api/v1/analysis/ml-survival/compare` - Compare survival models (sync)

### Natural Language Queries (NEW!)
- `POST /api/v1/nlq` - Process natural language query and return chart

### Jobs
- `GET /api/v1/jobs/{job_id}` - Get job status
- `GET /api/v1/jobs` - List all jobs
- `GET /api/v1/analysis/results/{job_id}` - Get analysis results

### Reports
- `GET /api/v1/reports/generate/{job_id}?format=pdf|docx` - Generate AI report

## 💬 Natural Language Query Examples

The NLQ interface allows you to ask questions in plain English:

```
✅ "Plot claim severity by age"
✅ "Show distribution of claim amounts"
✅ "Bar chart of frequency by region"
✅ "Heatmap of age vs status"
✅ "Scatter plot of age vs amount"
✅ "Compare values across categories"
```

**Supported Chart Types**:
- Bar charts
- Line charts
- Scatter plots
- Histograms
- Pie charts
- Heatmaps
- Boxplots

## 📊 Sample Datasets

### Survival Data
```csv
time,event,group,age
5,1,control,65
10,0,treated,72
3,1,control,58
8,0,treated,70
```

### Mortality Table
```csv
AGE,qx,lx,dx
0,0.007,100000,700
1,0.0005,99300,50
2,0.0003,99250,30
```

### Claims Triangle
```csv
origin,dev0,dev1,dev2,dev3
2018,100,150,180,200
2019,120,170,190,
2020,130,160,,
2021,140,,,
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Build
```bash
cd frontend
npm run build
```

## 🎯 User Workflow

1. **Sign In**: Use Google authentication
2. **Upload Dataset**: CSV file with your data
3. **AI Analysis**: Automatic dataset type detection and Gemini insights
4. **Navigate Dashboard**: Use sidebar to access different analysis modules:
   - **Summary**: Quick overview and recent jobs
   - **Survival Analysis**: KM curves and life tables
   - **GLM Pricing**: Configure and run pricing models
   - **ML Survival**: Train advanced survival models
   - **Mortality Tables**: Actuarial life table analytics
   - **AI Insights**: Natural language queries and data cleaning
   - **Workspace**: Detailed data profiling and exploration
5. **Ask Questions**: Use natural language queries for custom charts
6. **Run Advanced Analysis**: Submit jobs for GLM, time-series, ML models
7. **Generate Reports**: Export comprehensive PDF/DOCX reports

## 🔧 Configuration

### Gemini API Setup
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `backend/.env`: `GEMINI_API_KEY=your_key_here`

### Firebase Setup
1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable Google Authentication
3. Get web app credentials
4. Add to `frontend/.env.local`

## 📈 Analysis Output Schemas

### Survival Analysis
```json
{
  "meta": {
    "n": 100,
    "n_events": 45,
    "n_censored": 55,
    "median_follow_up": 24.5
  },
  "overall_km": {
    "timeline": [0, 6, 12, 18, 24],
    "survival": [1.0, 0.92, 0.85, 0.78, 0.71],
    "lower_ci": [...],
    "upper_ci": [...]
  },
  "life_table": [...],
  "nelson_aalen": {...},
  "strata": {...},
  "cox": {...}
}
```

### NLQ Response
```json
{
  "chart_type": "bar",
  "chart_data": {
    "labels": ["Category A", "Category B"],
    "datasets": [{
      "label": "Values",
      "data": [100, 150],
      "backgroundColor": "rgba(76, 175, 80, 0.6)"
    }]
  },
  "reasoning": "Comparing values across categories using a bar chart",
  "columns_used": ["category", "value"],
  "title": "Values by Category"
}
```

## 🐛 Troubleshooting

### Backend Issues
```bash
# Check if backend is running
curl http://localhost:8000/health

# View backend logs
docker logs adaas-backend

# Restart backend
uvicorn app.main:app --reload
```

### Redis Connection
```bash
# Test Redis connection
redis-cli ping

# Check Redis is running
docker ps | grep redis
```

### Frontend Issues
```bash
# Clear Next.js cache
rm -rf frontend/.next

# Rebuild
npm run build
npm run dev
```

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run build
npm start
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Recent Updates

### Version 4.0 (Latest) - UI Beautification & Feature Education
- ✨ **Complete UI Redesign**: Modern, vibrant design with gradient backgrounds and glassmorphism effects
- ✨ **Enhanced Design System**: Extended color palette (Blue, Emerald, Amber, Red, Violet, Indigo)
- ✨ **Feature Information Pages**: 8 dedicated educational pages explaining each feature for novice users:
  - `/features/ai-insights` - AI-powered analysis explained
  - `/features/survival-analysis` - Survival analysis concepts and methods
  - `/features/dataset-workspace` - Data profiling and quality assessment
  - `/features/glm-pricing` - GLM models (Poisson, Gamma, Negative Binomial)
  - `/features/ml-survival` - Machine learning survival models
  - `/features/mortality-tables` - Life tables and graduation methods
  - `/features/time-series` - Forecasting models (ARIMA, Prophet, Holt-Winters)
  - `/features/reserving` - Chain-ladder method and claims triangles
- ✨ **Visual Flow Diagrams**: Step-by-step process flows on each feature page
- ✨ **Comparison Tables**: ML vs Traditional methods, model comparisons
- ✨ **Real-World Examples**: Practical use cases with example data
- ✨ **Beautified Landing Page**: 
  - Modern hero section with AI-powered messaging
  - 8-feature showcase with Lucide icons
  - "How ADaaS Works" workflow visualization
  - "Why Actuaries Choose ADaaS" benefits section
  - Conditional CTAs based on authentication status
- ✨ **Redesigned Login Page**: 
  - Centered glassmorphism card design
  - ADaaS branding with gradient logo
  - Feature highlights and security badges
- ✨ **Enhanced Upload Page**: 
  - Glass-card design with gradient backgrounds
  - Improved file input styling
  - Better status badges and animations
- ✨ **Improved Dashboard Pages**: 
  - Consistent Lucide icons throughout
  - Modern card styles with hover effects
  - Smooth animations (fadeIn, slideUp, float)
  - Professional typography hierarchy
- ✨ **Button Variants**: Primary, secondary, outline, ghost, danger styles
- ✨ **Responsive Design**: Mobile-friendly with proper breakpoints
- 🔧 User profile integration in navbar with conditional rendering
- 🔧 Improved accessibility and user experience
- 🔧 Consistent spacing and layout across all pages

### Version 3.0 - Multi-Page Dashboard Architecture
- ✨ **Unified Sidebar Navigation**: Seamless navigation with Tailwind CSS and Lucide icons
- ✨ **8 Dedicated Dashboard Pages**: Summary, Survival, Reserving, GLM, ML Survival, Mortality, AI Insights, Workspace
- ✨ **Modular Architecture**: Easy to extend with new analysis modules
- ✨ **Responsive Design**: Mobile-friendly with hamburger menu
- ✨ **Dataset Type-Aware Navigation**: Conditional page visibility based on dataset type
- ✨ **Active Page Highlighting**: Clear visual indication of current location
- 🔧 Improved user experience with organized, focused pages
- 🔧 Better separation of concerns for maintainability

### Version 2.1
- ✨ **Dataset Workspace**: Comprehensive data profiling and quality assessment
- ✨ **Column Profiling**: Detailed statistics for every column with outlier detection
- ✨ **Correlation Analysis**: Pearson and Cramér's V correlation matrices
- ✨ **Auto-Generated Data Dictionary**: AI-powered column descriptions and quality flags
- ✨ **Data Quality Scoring**: Multi-dimensional quality assessment (completeness, uniqueness, consistency)
- 🔧 Enhanced data exploration before running analyses

### Version 2.0
- ✨ **Natural Language Query Interface**: Ask questions in plain English
- ✨ **Heatmap Visualizations**: Color-coded matrix charts
- ✨ **AI Report Generator**: Comprehensive PDF/DOCX exports
- ✨ **ML Survival Models**: Random Forest, Gradient Boosting, CoxNet
- ✨ **Mortality Analytics**: Complete life table and graduation methods
- ✨ **GLM Pricing**: Poisson, Gamma, Negative Binomial models
- ✨ **Time-Series Forecasting**: ARIMA, Prophet, Holt-Winters
- 🔧 Improved error handling and validation
- 🔧 Enhanced UI/UX with better visualizations
- 🔧 Optimized performance and data processing

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💡 Support

For issues, questions, or feature requests:
- Open a GitHub issue
- Check existing documentation
- Review API docs at http://localhost:8000/docs

## 🙏 Acknowledgments

- Google Gemini AI for intelligent analysis
- Firebase for authentication
- Chart.js for beautiful visualizations
- lifelines for survival analysis
- scikit-survival for ML survival models

---

**Built with ❤️ for actuaries and data scientists**
