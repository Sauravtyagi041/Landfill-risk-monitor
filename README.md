# LandRisk — Landfill Environmental Risk Monitor

An interactive dashboard prototype for exploring modeled environmental exposure risk near selected landfill sites in India.

[![Live demo](https://img.shields.io/badge/Live%20demo-Open%20dashboard-2ea44f?style=for-the-badge)](https://landfill-risk-monitor.vercel.app/)
[![Repository](https://img.shields.io/badge/GitHub-Source%20code-181717?style=for-the-badge&logo=github)](https://github.com/Sauravtyagi041/Landfill-risk-monitor)

> **Prototype notice:** LandRisk is an educational decision-support prototype. Risk scores and readings may be modeled; they are not official measurements, medical advice, or a substitute for regulatory or environmental monitoring.

## Overview

LandRisk brings landfill locations and a modeled risk estimate together on an interactive map. Choose a place to assess, review nearby landfill distance and environmental indicators, and see how distance and wind direction affect the displayed score.

- **Live prototype:** https://landfill-risk-monitor.vercel.app/
- **Source repository:** https://github.com/Sauravtyagi041/Landfill-risk-monitor

## Features

- Interactive map with 10 seeded landfill records covering Delhi, Mumbai, Ahmedabad, Hyderabad, Chennai, Bengaluru, and Pune.
- Choose an assessment location using browser geolocation, a map click, or the location search.
- Review the nearest landfill, distance, AQI, pollutant details, wind direction, and a risk explanation.
- Display modeled risk on a 0–100 scale with Low, Medium, High, and Severe bands.
- Show landfill markers and a modeled plume direction on the map.
- Use client-side modeled fallback readings when the risk API is unavailable.
- Include an AWS serverless backend template for a future live-data deployment.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React 18, Vite 5, Leaflet, React Leaflet, Lucide React, Tailwind CSS CDN |
| Backend template | Python 3.11, AWS SAM, API Gateway, AWS Lambda, DynamoDB, EventBridge, AWS Secrets Manager |
| External data providers | WAQI API and OpenWeather API (credentials required for live provider data) |

## Run locally

### Requirements

- Node.js and npm
- Git

### Start the dashboard

```bash
git clone https://github.com/Sauravtyagi041/Landfill-risk-monitor.git
cd Landfill-risk-monitor/client
npm install
npm run dev
```

Open [http://localhost:3000/](http://localhost:3000/) (or the local address printed in your terminal). `localhost` is only reachable from your own computer while the development server is running; it is not the public project link.

To build and preview a production frontend bundle:

```bash
npm run build
npm run preview
```

## Public demo and backend status

The public frontend is hosted on Vercel at [landfill-risk-monitor.vercel.app](https://landfill-risk-monitor.vercel.app/). The AWS files in this repository describe a backend deployment, but the deployed dashboard currently does **not** have a confirmed AWS API endpoint connected. It requests `/api/risk` and uses modeled client-side fallback readings when that route cannot be reached. Therefore, publishing the frontend does not by itself make AWS live data available.

The frontend's current Vite configuration does not define an API proxy or a configurable production API base URL. To connect a deployed AWS API, the frontend needs an API endpoint configuration and the API must allow requests from the Vercel site (CORS). Provider credentials belong in AWS Secrets Manager or the backend environment—not in frontend source code or Vercel client-visible variables.

## AWS backend template

The AWS SAM definition is in [`infra/template.yaml`](infra/template.yaml). It describes:

- API Gateway `GET` and `POST /api/risk` routes backed by Lambda.
- DynamoDB tables for landfill and environmental cache data.
- An EventBridge schedule to refresh cached readings every 15 minutes.
- A Secrets Manager secret for WAQI and OpenWeather provider keys.

The template contains placeholder secret values. You need an AWS account, permissions to create the listed resources, and valid provider API keys to enable live feeds. Do not commit real keys to GitHub.

Once AWS CLI and AWS SAM CLI are installed and configured for the target AWS account, deploy from the repository root:

```bash
cd infra
sam build --template-file template.yaml
sam deploy --guided --template-file .aws-sam/build/template.yaml
```

Save the API URL reported by the deployment. Before expecting live backend results, configure the frontend to call that URL, configure API Gateway CORS for the Vercel origin, and add provider credentials to AWS Secrets Manager. The repository's frontend-to-API wiring and backend packaging should be reviewed as part of that integration; the template alone does not mean the backend is already deployed.

## Risk model

The client fallback and backend use a simplified model based on AQI, distance, and whether wind is modeled as blowing toward the selected location:

```text
raw risk = AQI × (1 / max(distance_km, 0.3)) × wind factor
score    = clamp((raw risk / 110) × 100, 0, 100)
```

The wind factor is `1.5` when wind is modeled toward the selected location and `1.0` otherwise. The score bands are Low (<25), Medium (25–<50), High (50–<75), and Severe (≥75). These simplified calculations are indicative only and should not be interpreted as measured health exposure.

## Repository structure

```text
client/                  React + Vite dashboard
  src/components/        Map, risk card, alerts, and architecture UI
  src/data/              Seed landfill data
  src/utils/             Distance, wind, plume, and risk calculations
data/landfills.json      Backend landfill dataset
infra/template.yaml      AWS SAM infrastructure
infra/src/handlers/      Risk API and scheduled cache refresh
infra/src/utils/         Backend geographic and risk calculations
```

## License

No license file is currently included. Contact the repository owner for reuse and distribution terms.
